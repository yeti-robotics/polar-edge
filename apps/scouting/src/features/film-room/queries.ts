import "server-only";

import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { match, matchVideo, team, teamMatch, videoAnnotation } from "@/lib/database/schema";
import { getTBAClient } from "@/lib/server/tba";
import { firstYouTubeVideo, qualMatchLabel } from "./logic";
import type { Annotation, FilmRoomMatchOption, FilmRoomTeamOption, TeamFilmSummary } from "./types";

/**
 * YouTube ids TBA has for each qual match at an event, keyed by match number.
 * Only feeds the picker's "has video" hint, so a short cache is fine; opening a
 * match re-checks TBA directly. Resolves empty when TBA is unreachable.
 */
export async function getTbaQualVideos(eventCode: string): Promise<Record<number, string>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.tbaMatchVideos(eventCode));

  try {
    const matches = await getTBAClient().matches.getEventMatches(eventCode);
    const videos: Record<number, string> = {};
    for (const m of matches) {
      if (m.comp_level !== "qm") continue;
      const youtubeId = firstYouTubeVideo(m.videos);
      if (youtubeId) videos[m.match_number] = youtubeId;
    }
    return videos;
  } catch (error) {
    console.warn("[film-room] could not load TBA match videos:", error);
    return {};
  }
}

/** Every qual match at the event, with this org's video and TBA's video when they exist. */
export async function getQualMatchOptions(
  organizationId: string,
  eventId: string,
  eventCode: string
): Promise<FilmRoomMatchOption[]> {
  const [matches, videos, tbaVideos] = await Promise.all([
    db
      .select({ id: match.id, matchNumber: match.matchNumber })
      .from(match)
      .where(and(eq(match.eventId, eventId), eq(match.matchType, "qm")))
      .orderBy(asc(match.matchNumber)),
    db
      .select({ id: matchVideo.id, matchId: matchVideo.matchId })
      .from(matchVideo)
      .where(and(eq(matchVideo.organizationId, organizationId), eq(matchVideo.eventId, eventId)))
      .orderBy(desc(matchVideo.createdAt)),
    getTbaQualVideos(eventCode),
  ]);

  // Newest video wins when a match was opened more than once.
  const videoByMatch = new Map<string, string>();
  for (const v of videos) {
    if (v.matchId && !videoByMatch.has(v.matchId)) videoByMatch.set(v.matchId, v.id);
  }

  return matches.map((m) => ({
    matchId: m.id,
    matchNumber: m.matchNumber,
    label: qualMatchLabel(m.matchNumber),
    videoId: videoByMatch.get(m.id) ?? null,
    tbaYoutubeId: tbaVideos[m.matchNumber] ?? null,
  }));
}

export async function getMatchVideo(videoId: string, organizationId: string) {
  const [row] = await db
    .select({
      video: matchVideo,
      matchNumber: match.matchNumber,
      matchType: match.matchType,
    })
    .from(matchVideo)
    .leftJoin(match, eq(match.id, matchVideo.matchId))
    .where(and(eq(matchVideo.id, videoId), eq(matchVideo.organizationId, organizationId)))
    .limit(1);
  return row ?? null;
}

/** The latest video this org opened for a match. */
export async function getLatestVideoForMatch(matchId: string, organizationId: string) {
  const [row] = await db
    .select({ id: matchVideo.id })
    .from(matchVideo)
    .where(and(eq(matchVideo.matchId, matchId), eq(matchVideo.organizationId, organizationId)))
    .orderBy(desc(matchVideo.createdAt))
    .limit(1);
  return row ?? null;
}

/** The six teams in a match, red 1-3 then blue 1-3. */
export async function getMatchTeams(matchId: string): Promise<FilmRoomTeamOption[]> {
  const rows = await db
    .select({ teamNumber: teamMatch.teamNumber, name: team.teamName })
    .from(teamMatch)
    .innerJoin(team, eq(team.teamNumber, teamMatch.teamNumber))
    .where(eq(teamMatch.matchId, matchId))
    .orderBy(desc(teamMatch.alliance), asc(teamMatch.position));
  return rows;
}

export async function getVideoAnnotations(
  videoId: string,
  organizationId: string
): Promise<Annotation[]> {
  return db
    .select({
      id: videoAnnotation.id,
      timestamp: videoAnnotation.timestampSeconds,
      durationSeconds: videoAnnotation.durationSeconds,
      type: videoAnnotation.type,
      points: videoAnnotation.points,
      verdict: videoAnnotation.verdict,
      note: videoAnnotation.note,
      teamNumber: videoAnnotation.teamNumber,
    })
    .from(videoAnnotation)
    .where(
      and(eq(videoAnnotation.videoId, videoId), eq(videoAnnotation.organizationId, organizationId))
    )
    .orderBy(asc(videoAnnotation.timestampSeconds));
}

/**
 * Film Room roll-up for the team analysis page: Good/Bad counts across every
 * mark tagged with this team, plus the marks that carry a written note.
 */
export async function getTeamFilmSummary(
  teamNumber: number,
  organizationId: string,
  eventId: string | null
): Promise<TeamFilmSummary> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.filmNotes(organizationId));

  const scope = and(
    eq(videoAnnotation.teamNumber, teamNumber),
    eq(videoAnnotation.organizationId, organizationId),
    eventId ? eq(matchVideo.eventId, eventId) : undefined
  );

  const [[counts], notes] = await Promise.all([
    db
      .select({
        good: sql<number>`count(*) filter (where ${videoAnnotation.verdict} = 'good')`.mapWith(
          Number
        ),
        bad: sql<number>`count(*) filter (where ${videoAnnotation.verdict} = 'bad')`.mapWith(
          Number
        ),
      })
      .from(videoAnnotation)
      .innerJoin(matchVideo, eq(matchVideo.id, videoAnnotation.videoId))
      .where(scope),
    db
      .select({
        id: videoAnnotation.id,
        note: videoAnnotation.note,
        verdict: videoAnnotation.verdict,
        timestamp: videoAnnotation.timestampSeconds,
        videoId: matchVideo.id,
        videoTitle: matchVideo.title,
        createdAt: videoAnnotation.createdAt,
      })
      .from(videoAnnotation)
      .innerJoin(matchVideo, eq(matchVideo.id, videoAnnotation.videoId))
      .where(and(scope, isNotNull(videoAnnotation.note)))
      .orderBy(desc(videoAnnotation.createdAt))
      .limit(50),
  ]);

  return {
    good: counts?.good ?? 0,
    bad: counts?.bad ?? 0,
    notes: notes.map((n) => ({ ...n, note: n.note ?? "" })),
  };
}
