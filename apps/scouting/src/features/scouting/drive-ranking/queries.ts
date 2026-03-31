import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { driveTeamRanking, driveTeamRankingEntry, match, team } from "@/lib/database/schema";
import { computeDriveRatings } from "./logic";
import type { DriveRatingHistoryPoint, DriveTeamRating } from "./types";

/**
 * Get all drive team ranking observations for an organization, optionally filtered by event.
 * Returns them chronologically for OpenSkill processing.
 */
async function getRankingObservations(organizationId: string, eventId?: string | null) {
  const conditions = [eq(driveTeamRanking.organizationId, organizationId)];
  if (eventId) {
    conditions.push(eq(match.eventId, eventId));
  }

  const rows = await db
    .select({
      matchNumber: match.matchNumber,
      matchType: match.matchType,
      teamNumber: driveTeamRankingEntry.teamNumber,
      rank: driveTeamRankingEntry.rank,
      rankingId: driveTeamRanking.id,
    })
    .from(driveTeamRankingEntry)
    .innerJoin(driveTeamRanking, eq(driveTeamRankingEntry.rankingId, driveTeamRanking.id))
    .innerJoin(match, eq(driveTeamRanking.matchId, match.id))
    .where(and(...conditions))
    .orderBy(asc(match.matchNumber));

  // Group entries by ranking ID to reconstruct per-match observations
  const byRanking = new Map<
    string,
    { matchNumber: number; matchType: string; entries: { teamNumber: number; rank: number }[] }
  >();

  for (const row of rows) {
    if (!byRanking.has(row.rankingId)) {
      byRanking.set(row.rankingId, {
        matchNumber: row.matchNumber,
        matchType: row.matchType,
        entries: [],
      });
    }
    byRanking.get(row.rankingId)?.entries.push({
      teamNumber: row.teamNumber,
      rank: row.rank,
    });
  }

  // Convert to ordered observations
  return Array.from(byRanking.values())
    .sort((a, b) => a.matchNumber - b.matchNumber)
    .map((obs) => ({
      matchNumber: obs.matchNumber,
      matchType: obs.matchType,
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
  cacheLife("minutes");
  cacheTag(cacheTags.driveRanking(organizationId));

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
  cacheLife("minutes");
  cacheTag(cacheTags.driveRanking(organizationId));

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
