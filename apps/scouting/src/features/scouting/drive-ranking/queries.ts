import "server-only";

import { and, asc, eq, inArray, lte } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  driveTeamRanking,
  driveTeamRankingEntry,
  event,
  match,
  team,
  teamMatch,
} from "@/lib/database/schema";
import { computeDriveRatings } from "./logic";
import type { DriveRatingHistoryPoint, DriveTeamRating } from "./types";

/**
 * Get all drive team ranking observations for an organization.
 *
 * When eventId is provided, returns all observations up to and including
 * that event (by start date) — so ratings reflect the full season history
 * without leaking future data.
 */
async function getRankingObservations(organizationId: string, eventId?: string | null) {
  const conditions = [eq(driveTeamRanking.organizationId, organizationId)];

  if (eventId) {
    // Look up the event's start date to use as a cutoff
    const targetEvent = await db
      .select({ startDate: event.startDate })
      .from(event)
      .where(eq(event.id, eventId))
      .limit(1);

    const cutoff = targetEvent[0]?.startDate;
    if (cutoff) {
      conditions.push(lte(event.startDate, cutoff));
    }
  }

  const rows = await db
    .select({
      matchNumber: match.matchNumber,
      matchType: match.matchType,
      teamNumber: driveTeamRankingEntry.teamNumber,
      rank: driveTeamRankingEntry.rank,
      rankingId: driveTeamRanking.id,
      eventStartDate: event.startDate,
      eventCode: event.eventCode,
    })
    .from(driveTeamRankingEntry)
    .innerJoin(driveTeamRanking, eq(driveTeamRankingEntry.rankingId, driveTeamRanking.id))
    .innerJoin(match, eq(driveTeamRanking.matchId, match.id))
    .innerJoin(event, eq(match.eventId, event.id))
    .where(and(...conditions))
    .orderBy(asc(event.startDate), asc(match.matchNumber));

  // Group entries by ranking ID to reconstruct per-match observations
  const byRanking = new Map<
    string,
    {
      matchNumber: number;
      matchType: string;
      eventStartDate: Date | null;
      eventCode: string;
      entries: { teamNumber: number; rank: number }[];
    }
  >();

  for (const row of rows) {
    if (!byRanking.has(row.rankingId)) {
      byRanking.set(row.rankingId, {
        matchNumber: row.matchNumber,
        matchType: row.matchType,
        eventStartDate: row.eventStartDate,
        eventCode: row.eventCode,
        entries: [],
      });
    }
    byRanking.get(row.rankingId)?.entries.push({
      teamNumber: row.teamNumber,
      rank: row.rank,
    });
  }

  // Sort chronologically: by event start date, then match number
  return Array.from(byRanking.values())
    .sort((a, b) => {
      const dateA = a.eventStartDate?.getTime() ?? 0;
      const dateB = b.eventStartDate?.getTime() ?? 0;
      if (dateA !== dateB) return dateA - dateB;
      return a.matchNumber - b.matchNumber;
    })
    .map((obs) => ({
      matchNumber: obs.matchNumber,
      matchType: obs.matchType,
      eventCode: obs.eventCode,
      rankedTeams: obs.entries.sort((a, b) => a.rank - b.rank).map((e) => e.teamNumber),
    }));
}

/**
 * Compute drive team ratings for an organization (optionally scoped to event).
 */
export async function getDriveTeamRatings(
  organizationId: string,
  eventId?: string | null
): Promise<DriveTeamRating[]> {
  "use cache";
  cacheLife("seconds");
  cacheTag(cacheTags.driveRanking(organizationId, eventId));

  const observations = await getRankingObservations(organizationId, eventId);
  if (observations.length === 0) return [];

  // Collect all team numbers to fetch names
  const allTeamNumbers = new Set(observations.flatMap((o) => o.rankedTeams));
  const teamRows = await db
    .select({ teamNumber: team.teamNumber, teamName: team.teamName })
    .from(team)
    .where(inArray(team.teamNumber, [...allTeamNumbers]));

  const teamNames = new Map(teamRows.map((t) => [t.teamNumber, t.teamName]));
  const { ratings } = computeDriveRatings(observations, teamNames);

  // When scoped to an event, only return teams actually at that event
  if (eventId) {
    const eventTeamRows = await db
      .selectDistinct({ teamNumber: teamMatch.teamNumber })
      .from(teamMatch)
      .where(eq(teamMatch.eventId, eventId));

    const eventTeamNumbers = new Set(eventTeamRows.map((r) => r.teamNumber));
    return ratings.filter((r) => eventTeamNumbers.has(r.teamNumber));
  }

  return ratings;
}

/**
 * Get match-by-match rating history for a specific team.
 */
export async function getDriveRatingHistory(
  teamNumber: number,
  organizationId: string,
  eventId?: string | null
): Promise<DriveRatingHistoryPoint[]> {
  "use cache";
  cacheLife("seconds");
  cacheTag(cacheTags.driveRanking(organizationId, eventId));

  const observations = await getRankingObservations(organizationId, eventId);
  if (observations.length === 0) return [];

  const teamNames = new Map<number, string>();
  const { history } = computeDriveRatings(observations, teamNames);

  return history.get(teamNumber) ?? [];
}

/**
 * Check if a ranking already exists for a match + alliance + org.
 */
export async function getExistingRanking(
  matchId: string,
  alliance: "red" | "blue",
  organizationId: string
) {
  return db.query.driveTeamRanking.findFirst({
    where: and(
      eq(driveTeamRanking.matchId, matchId),
      eq(driveTeamRanking.alliance, alliance),
      eq(driveTeamRanking.organizationId, organizationId)
    ),
    with: {
      entries: true,
    },
  });
}
