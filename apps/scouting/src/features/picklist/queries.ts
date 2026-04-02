import "server-only";

import { and, count, eq, notInArray, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getWorkabilitySummaryForEvent } from "@/features/scouting/workability/queries";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  climb,
  picklist,
  picklistTeam,
  standForm,
  team,
  teamMatch,
  vTeamMatchConsensus,
} from "@/lib/database/schema";
import type { TeamWorkabilitySummary, WorkabilityNote } from "@/features/scouting/workability/types";

/**
 * Get all picklists for a specific organization and event
 * Returns picklists with team count
 */
export async function getPicklistsForEvent(organizationId: string, eventId: string) {
  const picklists = await db
    .select({
      id: picklist.id,
      name: picklist.name,
      createdAt: picklist.createdAt,
      updatedAt: picklist.updatedAt,
      teamCount: count(picklistTeam.id),
    })
    .from(picklist)
    .leftJoin(picklistTeam, eq(picklist.id, picklistTeam.picklistId))
    .where(and(eq(picklist.organizationId, organizationId), eq(picklist.eventId, eventId)))
    .groupBy(picklist.id)
    .orderBy(picklist.createdAt);

  return picklists;
}

/**
 * Get a single picklist with all its teams, ordered by rank
 * Verifies the picklist belongs to the specified organization
 */
export async function getPicklistWithTeams(picklistId: string, organizationId: string) {
  // First verify the picklist belongs to this organization
  const picklistRecord = await db.query.picklist.findFirst({
    where: and(eq(picklist.id, picklistId), eq(picklist.organizationId, organizationId)),
  });

  if (!picklistRecord) {
    return null;
  }

  // Get all teams in the picklist with team details
  const teams = await db
    .select({
      teamNumber: picklistTeam.teamNumber,
      rank: picklistTeam.rank,
      teamName: team.teamName,
      picked: picklistTeam.picked,
      notes: picklistTeam.notes,
    })
    .from(picklistTeam)
    .innerJoin(team, eq(picklistTeam.teamNumber, team.teamNumber))
    .where(eq(picklistTeam.picklistId, picklistId))
    .orderBy(picklistTeam.rank);

  // Get metrics for all teams at this event
  const [metricsMap, workabilitySummary] = await Promise.all([
    getTeamMetricsForEvent(picklistRecord.eventId),
    getWorkabilitySummaryForEvent(picklistRecord.eventId, organizationId),
  ]);

  // Attach metrics to each team
  const teamsWithMetrics = teams.map((t) => {
    const metrics = metricsMap.get(t.teamNumber);
    const compatibility = getCompatibilityMetricsForTeam(workabilitySummary, t.teamNumber);

    return {
      ...t,
      avgTotalPoints: metrics?.avgTotalPoints,
      climbSuccessPct: metrics?.climbSuccessPct,
      uptimePct: metrics?.uptimePct,
      matchesScouted: metrics?.matchesScouted,
      ...compatibility,
    };
  });

  return {
    picklist: picklistRecord,
    teams: teamsWithMetrics,
  };
}

/**
 * Get all teams at a specific event
 */
export async function getTeamsForEvent(eventId: string) {
  const teams = await db
    .selectDistinct({
      teamNumber: teamMatch.teamNumber,
      teamName: team.teamName,
    })
    .from(teamMatch)
    .innerJoin(team, eq(teamMatch.teamNumber, team.teamNumber))
    .where(eq(teamMatch.eventId, eventId))
    .orderBy(teamMatch.teamNumber);

  return teams;
}

/**
 * Get teams at an event that are not already in a picklist
 */
export async function getAvailableTeamsForPicklist(eventId: string, picklistId: string) {
  // Get team numbers already in the picklist
  const picklistTeams = await db
    .select({ teamNumber: picklistTeam.teamNumber })
    .from(picklistTeam)
    .where(eq(picklistTeam.picklistId, picklistId));

  const picklistTeamNumbers = picklistTeams.map((t) => t.teamNumber);

  // Get all teams at the event
  const allTeams = await db
    .selectDistinct({
      teamNumber: teamMatch.teamNumber,
      teamName: team.teamName,
    })
    .from(teamMatch)
    .innerJoin(team, eq(teamMatch.teamNumber, team.teamNumber))
    .where(
      picklistTeamNumbers.length > 0
        ? and(eq(teamMatch.eventId, eventId), notInArray(teamMatch.teamNumber, picklistTeamNumbers))
        : eq(teamMatch.eventId, eventId)
    )
    .orderBy(teamMatch.teamNumber);

  return allTeams;
}

export interface TeamMetrics {
  teamNumber: number;
  avgTotalPoints: number;
  climbSuccessPct: number;
  uptimePct: number;
  matchesScouted: number;
}

export interface TeamCompatibilityMetrics {
  avgDriverWorkability: number | null;
  avgHumanPlayerWorkability: number | null;
  compositeCompatibilityScore: number | null;
  submissionCount: number;
  noteCount: number;
  compatibilityNotes: WorkabilityNote[];
}

/**
 * Get performance metrics for all teams at a specific event
 * Returns metrics including avg points, climb success %, uptime %, and match count
 */
export async function getTeamMetricsForEvent(eventId: string): Promise<Map<number, TeamMetrics>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.teamMetrics(eventId));

  // Get avg points and match count with consensus data
  const pointsData = await db
    .select({
      teamNumber: teamMatch.teamNumber,
      avgTotalPoints: sql<number>`avg(coalesce(${vTeamMatchConsensus.expFuelActive}, 0) + coalesce(${vTeamMatchConsensus.expTower}, 0))`,
      matchesScouted: count(vTeamMatchConsensus.teamMatchId),
    })
    .from(teamMatch)
    .leftJoin(vTeamMatchConsensus, eq(teamMatch.id, vTeamMatchConsensus.teamMatchId))
    .where(eq(teamMatch.eventId, eventId))
    .groupBy(teamMatch.teamNumber);

  // Get climb success rate
  const climbData = await db
    .select({
      teamNumber: teamMatch.teamNumber,
      climbSuccessPct: sql<number>`(sum(case when ${climb.climbSuccess} then 1 else 0 end)::float / nullif(count(*), 0) * 100)`,
    })
    .from(climb)
    .innerJoin(standForm, eq(standForm.id, climb.standFormId))
    .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
    .where(eq(teamMatch.eventId, eventId))
    .groupBy(teamMatch.teamNumber);

  // Get uptime % (based on oof_time_seconds)
  // Use median or average across all stand forms for a team
  const uptimeData = await db
    .select({
      teamNumber: teamMatch.teamNumber,
      uptimePct: sql<number>`avg((150.0 - least(${standForm.oofTimeSeconds}, 150)) / 150.0 * 100)`,
    })
    .from(standForm)
    .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
    .where(eq(teamMatch.eventId, eventId))
    .groupBy(teamMatch.teamNumber);

  // Merge all data into a Map
  const metricsMap = new Map<number, TeamMetrics>();

  for (const p of pointsData) {
    metricsMap.set(p.teamNumber, {
      teamNumber: p.teamNumber,
      avgTotalPoints: Number(p.avgTotalPoints) || 0,
      climbSuccessPct: 0,
      uptimePct: 0,
      matchesScouted: Number(p.matchesScouted) || 0,
    });
  }

  for (const c of climbData) {
    const metrics = metricsMap.get(c.teamNumber);
    if (metrics) {
      metrics.climbSuccessPct = Number(c.climbSuccessPct) || 0;
    }
  }

  for (const u of uptimeData) {
    const metrics = metricsMap.get(u.teamNumber);
    if (metrics) {
      metrics.uptimePct = Number(u.uptimePct) || 0;
    }
  }

  return metricsMap;
}

export function getCompatibilityMetricsForTeam(
  workabilityMap: Map<number, TeamWorkabilitySummary>,
  teamNumber: number
) {
  const compatibility = workabilityMap.get(teamNumber);

  return {
    avgDriverWorkability: compatibility?.avgDriverWorkability ?? null,
    avgHumanPlayerWorkability: compatibility?.avgHumanPlayerWorkability ?? null,
    compositeCompatibilityScore: compatibility?.compositeCompatibilityScore ?? null,
    submissionCount: compatibility?.submissionCount ?? 0,
    noteCount: compatibility?.noteCount ?? 0,
    compatibilityNotes: compatibility?.notes ?? [],
  };
}
