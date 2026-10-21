"use server";

import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  event,
  match,
  matchVideo,
  organizationEvent,
  videoAnnotation,
} from "@/lib/database/schema";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { getTBAClient } from "@/lib/server/tba";
import {
  firstYouTubeVideo,
  MAX_ANNOTATION_POINTS,
  parseYouTubeId,
  qualMatchLabel,
  tbaQualMatchKey,
} from "./logic";
import { getLatestVideoForMatch } from "./queries";

/** `retryable` marks a failure a later attempt could survive, like an expired
 * session. The offline mark queue keeps those ops instead of dropping them. */
type ActionResult<T> =
  | { success: true; data: T }
  | { success?: never; error: string; retryable?: boolean };

async function getActiveMember() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) return null;
  const member = await auth.api.getActiveMember({ headers: requestHeaders });
  if (!member?.organizationId) return null;
  return member;
}

/* -------------------------------------------------------------------------- */
/* Videos                                                                      */
/* -------------------------------------------------------------------------- */

const openMatchSchema = z.object({ matchId: z.string().uuid() });

/**
 * Reopens this org's existing video for a match, or starts one from the video
 * TBA lists for it. When neither exists the picker asks for a link instead.
 */
export async function openMatchVideo(
  input: unknown
): Promise<ActionResult<{ videoId: string } | { needsSource: true }>> {
  const member = await getActiveMember();
  if (!member) return { error: "Unauthorized" };

  const validated = openMatchSchema.safeParse(input);
  if (!validated.success) return { error: "Invalid input" };
  const { matchId } = validated.data;

  const existing = await getLatestVideoForMatch(matchId, member.organizationId);
  if (existing) return { success: true, data: { videoId: existing.id } };

  const [row] = await db
    .select({ matchNumber: match.matchNumber, eventId: match.eventId, eventCode: event.eventCode })
    .from(match)
    .innerJoin(event, eq(event.id, match.eventId))
    .innerJoin(
      organizationEvent,
      and(
        eq(organizationEvent.eventId, match.eventId),
        eq(organizationEvent.organizationId, member.organizationId)
      )
    )
    .where(and(eq(match.id, matchId), eq(match.matchType, "qm")))
    .limit(1);
  if (!row) return { error: "Match not found" };

  let youtubeId: string | null = null;
  try {
    const tbaMatch = await getTBAClient().matches.getByKey(
      tbaQualMatchKey(row.eventCode, row.matchNumber)
    );
    youtubeId = firstYouTubeVideo(tbaMatch.videos);
  } catch (error) {
    console.warn("[film-room] TBA match lookup failed:", error);
  }
  if (!youtubeId) return { success: true, data: { needsSource: true } };

  const [created] = await db
    .insert(matchVideo)
    .values({
      organizationId: member.organizationId,
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
      youtubeId,
      title: qualMatchLabel(row.matchNumber),
      matchId,
      eventId: row.eventId,
      createdByMemberId: member.id,
    })
    .returning({ id: matchVideo.id });

  if (!created) return { error: "Couldn't create the video" };
  return { success: true, data: { videoId: created.id } };
}

const createVideoSchema = z.object({
  url: z.string().min(1).max(2000),
  matchId: z.string().uuid().nullish(),
});

export async function createMatchVideo(input: unknown): Promise<ActionResult<{ videoId: string }>> {
  const member = await getActiveMember();
  if (!member) return { error: "Unauthorized" };

  const validated = createVideoSchema.safeParse(input);
  if (!validated.success) return { error: "Invalid input" };
  const data = validated.data;

  const youtubeId = parseYouTubeId(data.url);
  if (!youtubeId) return { error: "That doesn't look like a YouTube link." };

  // Tie the video to its match and that match's event when one was picked,
  // otherwise file it under the active event so it still scopes correctly
  let eventId: string | null = null;
  let title = "YouTube clip";
  if (data.matchId) {
    const [row] = await db
      .select({ matchNumber: match.matchNumber, eventId: match.eventId })
      .from(match)
      .innerJoin(
        organizationEvent,
        and(
          eq(organizationEvent.eventId, match.eventId),
          eq(organizationEvent.organizationId, member.organizationId)
        )
      )
      .where(eq(match.id, data.matchId))
      .limit(1);
    if (!row) return { error: "Match not found" };
    eventId = row.eventId;
    title = qualMatchLabel(row.matchNumber);
  } else {
    const active = await getActiveEventForOrganization(member.organizationId);
    eventId = active?.eventId ?? null;
  }

  const [created] = await db
    .insert(matchVideo)
    .values({
      organizationId: member.organizationId,
      url: data.url.trim(),
      youtubeId,
      title,
      matchId: data.matchId ?? null,
      eventId,
      createdByMemberId: member.id,
    })
    .returning({ id: matchVideo.id });

  if (!created) return { error: "Couldn't create the video" };
  return { success: true, data: { videoId: created.id } };
}

/* -------------------------------------------------------------------------- */
/* Marks                                                                       */
/* -------------------------------------------------------------------------- */

const pointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const annotationSchema = z.object({
  videoId: z.string().uuid(),
  annotation: z.object({
    // Client-generated, so a retry after a dropped connection is idempotent
    id: z.string().uuid(),
    timestamp: z.number().int().min(0),
    durationSeconds: z.number().int().positive().max(60),
    type: z.enum(["pen", "line", "arrow", "rect", "ellipse"]),
    points: z.array(pointSchema).min(1).max(MAX_ANNOTATION_POINTS),
    verdict: z.enum(["good", "bad"]).nullish(),
    note: z.string().max(2000).nullish(),
    teamNumber: z.number().int().positive().nullish(),
  }),
});

/**
 * Upserts one mark by its client id. Any member of the org may edit a shared
 * mark, but the author column keeps whoever drew it first.
 */
export async function saveAnnotation(input: unknown): Promise<ActionResult<{ id: string }>> {
  const member = await getActiveMember();
  if (!member) return { error: "Unauthorized", retryable: true };

  const validated = annotationSchema.safeParse(input);
  if (!validated.success) return { error: "Invalid input" };
  const { videoId, annotation: a } = validated.data;

  const video = await db.query.matchVideo.findFirst({
    columns: { id: true },
    where: and(eq(matchVideo.id, videoId), eq(matchVideo.organizationId, member.organizationId)),
  });
  if (!video) return { error: "Video not found" };

  const values = {
    timestampSeconds: a.timestamp,
    durationSeconds: a.durationSeconds,
    type: a.type,
    points: a.points,
    verdict: a.verdict ?? null,
    note: a.note?.trim() || null,
    teamNumber: a.teamNumber ?? null,
  };

  const [saved] = await db
    .insert(videoAnnotation)
    .values({
      id: a.id,
      videoId,
      organizationId: member.organizationId,
      createdByMemberId: member.id,
      ...values,
    })
    .onConflictDoUpdate({
      target: videoAnnotation.id,
      set: values,
      // Never let an id collision rewrite another org's row
      setWhere: and(
        eq(videoAnnotation.organizationId, member.organizationId),
        eq(videoAnnotation.videoId, videoId)
      ),
    })
    .returning({ id: videoAnnotation.id });

  if (!saved) return { error: "Mark not found" };

  revalidateTag(cacheTags.filmNotes(member.organizationId), "max");
  return { success: true, data: { id: saved.id } };
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function deleteAnnotation(input: unknown): Promise<ActionResult<{ id: string }>> {
  const member = await getActiveMember();
  if (!member) return { error: "Unauthorized", retryable: true };

  const validated = deleteSchema.safeParse(input);
  if (!validated.success) return { error: "Invalid input" };

  // Deleting a row that's already gone is fine: a retried delete must not fail
  await db
    .delete(videoAnnotation)
    .where(
      and(
        eq(videoAnnotation.id, validated.data.id),
        eq(videoAnnotation.organizationId, member.organizationId)
      )
    );

  revalidateTag(cacheTags.filmNotes(member.organizationId), "max");
  return { success: true, data: { id: validated.data.id } };
}
