"use server";

import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { event, match, matchVideo, videoAnnotation } from "@/lib/database/schema";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { createPresignedUploadUrl } from "@/lib/server/storage";
import { getTBAClient } from "@/lib/server/tba";
import { firstYouTubeVideo, parseYouTubeId, qualMatchLabel, tbaQualMatchKey } from "./logic";
import { getLatestVideoForMatch } from "./queries";

type ActionResult<T> = { success: true; data: T } | { success?: never; error: string };

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
 * A qual match was picked. Reopens this org's existing video for it, or starts
 * one from the YouTube video TBA lists for the match. When neither exists the
 * picker asks for a link or an upload instead.
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
      source: "youtube",
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

const createVideoSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("youtube"),
    url: z.string().min(1).max(2000),
    matchId: z.string().uuid().nullish(),
  }),
  z.object({
    source: z.literal("upload"),
    storageKey: z.string().min(1).max(512),
    fileName: z.string().max(200).nullish(),
    matchId: z.string().uuid().nullish(),
  }),
]);

/** A pasted YouTube link or a finished upload, optionally tied to a qual match. */
export async function createMatchVideo(input: unknown): Promise<ActionResult<{ videoId: string }>> {
  const member = await getActiveMember();
  if (!member) return { error: "Unauthorized" };

  const validated = createVideoSchema.safeParse(input);
  if (!validated.success) return { error: "Invalid input" };
  const data = validated.data;

  let youtubeId: string | null = null;
  if (data.source === "youtube") {
    youtubeId = parseYouTubeId(data.url);
    if (!youtubeId) return { error: "That doesn't look like a YouTube link." };
  } else if (!data.storageKey.startsWith(`${member.organizationId}/match-videos/`)) {
    return { error: "Invalid upload" };
  }

  // Tie the video to its match (and that match's event) when one was picked;
  // otherwise file it under the active event so it still scopes correctly.
  let eventId: string | null = null;
  let title: string =
    data.source === "youtube" ? "YouTube clip" : data.fileName?.trim() || "Uploaded clip";
  if (data.matchId) {
    const [row] = await db
      .select({ matchNumber: match.matchNumber, eventId: match.eventId })
      .from(match)
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
      source: data.source,
      url: data.source === "youtube" ? data.url.trim() : null,
      youtubeId,
      storageKey: data.source === "upload" ? data.storageKey : null,
      title,
      matchId: data.matchId ?? null,
      eventId,
      createdByMemberId: member.id,
    })
    .returning({ id: matchVideo.id });

  if (!created) return { error: "Couldn't create the video" };
  return { success: true, data: { videoId: created.id } };
}

const VIDEO_CONTENT_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2GB: a full match straight off an iPad

const uploadUrlSchema = z.object({
  contentType: z.enum(VIDEO_CONTENT_TYPES),
  fileSize: z.number().int().positive().max(MAX_VIDEO_BYTES),
});

/** Presigned PUT for a clip from Photos, same storage as pit photos. */
export async function getVideoUploadUrl(
  input: unknown
): Promise<ActionResult<{ url: string; key: string }>> {
  const member = await getActiveMember();
  if (!member) return { error: "Unauthorized" };

  const validated = uploadUrlSchema.safeParse(input);
  if (!validated.success) {
    return { error: "Pick an MP4, MOV or WebM video under 2GB." };
  }

  const extension = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" }[
    validated.data.contentType
  ];
  const key = `${member.organizationId}/match-videos/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  try {
    // Sign the size too: checking the browser-supplied number on its own would
    // leave the presigned PUT free to carry a body of any length.
    const result = await createPresignedUploadUrl(
      key,
      validated.data.contentType,
      validated.data.fileSize
    );
    return { success: true, data: result };
  } catch (error) {
    console.error("[film-room] upload URL error:", error);
    return { error: "Uploads aren't set up on this server." };
  }
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
    /** Client-generated so a retry after a dropped connection stays idempotent. */
    id: z.string().uuid(),
    timestamp: z.number().int().min(0),
    durationSeconds: z.number().int().positive().max(60),
    type: z.enum(["pen", "line", "arrow", "rect", "ellipse"]),
    points: z.array(pointSchema).min(1).max(2000),
    verdict: z.enum(["good", "bad"]).nullish(),
    note: z.string().max(2000).nullish(),
    teamNumber: z.number().int().positive().nullish(),
  }),
});

/**
 * Autosave for one mark: "Save mark" and Undo both land here. Upserts by the
 * client id; any member of the org may edit a shared mark, but the author
 * column keeps whoever drew it first.
 */
export async function saveAnnotation(input: unknown): Promise<ActionResult<{ id: string }>> {
  const member = await getActiveMember();
  if (!member) return { error: "Unauthorized" };

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
      // Never let an id collision rewrite another org's row.
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
  if (!member) return { error: "Unauthorized" };

  const validated = deleteSchema.safeParse(input);
  if (!validated.success) return { error: "Invalid input" };

  // Deleting a row that's already gone is fine: a retried delete must not fail.
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
