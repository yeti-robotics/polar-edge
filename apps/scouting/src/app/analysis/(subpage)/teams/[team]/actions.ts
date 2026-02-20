import "server-only";

import { and, asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/database";
import {
  climb,
  cycle,
  event,
  match,
  member,
  pitForm,
  pitPhoto,
  standForm,
  teamMatch,
} from "@/lib/database/schema";
import { vStandFormExpected } from "@/lib/database/schema/views/metrics";
import { createPitPhotoViewToken } from "@/lib/server/pit-photo-token";

export interface TeamStats {
  goblinPerMatch: number;
  rpmagicPerMatch: number;
  clankPerMatch: number;
  matchesCount: number;
}

export interface CycleSummary {
  autoCycles: number;
  teleopCycles: number;
  totalCycles: number;
}

export interface ClimbSummary {
  successRate: number;
  avgLevel: number;
  avgDuration: number;
  totalAttempts: number;
}

export interface MatchHistoryItem {
  teamMatchId: number;
  matchId: string;
  matchType: string;
  matchNumber: number;
  eventCode: string;
  eventName: string;
  alliance: "red" | "blue";
  position: number;
  expFuelActive: number;
  expTower: number;
  clank: number;
  nScouts: number;
  cycleSummary: CycleSummary;
  climbSummary: ClimbSummary;
}

export interface CycleDetail {
  id: string;
  phase: "auto" | "teleop";
  cycleNumber: number;
  bucket: number;
  dumpDuration: number;
}

export interface ClimbDetail {
  id: string;
  climbLevel: number;
  climbSuccess: boolean;
  climbDuration: number;
  climbPhase: "auto" | "teleop";
}

export interface MatchDetails {
  cycles: CycleDetail[];
  climbs: ClimbDetail[];
}

export async function getTeamMatchHistory(
  teamNumber: number,
  organizationId: string | null,
  filterByOrg: boolean = true
): Promise<MatchHistoryItem[]> {
  if (filterByOrg && !organizationId) {
    return [];
  }

  // Get all team matches for this team
  const allMatches = await db
    .select({
      teamMatchId: teamMatch.id,
      matchId: teamMatch.matchId,
      alliance: teamMatch.alliance,
      position: teamMatch.position,
      matchType: match.matchType,
      matchNumber: match.matchNumber,
      eventCode: event.eventCode,
      eventName: event.name,
    })
    .from(teamMatch)
    .innerJoin(match, eq(match.id, teamMatch.matchId))
    .innerJoin(event, eq(event.id, teamMatch.eventId))
    .where(eq(teamMatch.teamNumber, teamNumber))
    .orderBy(desc(event.startDate), desc(match.matchNumber));

  if (allMatches.length === 0) {
    return [];
  }

  const teamMatchIds = allMatches.map((m) => m.teamMatchId);

  // Get stand forms from this organization for these team matches (or all if not filtering)
  let matches = allMatches;
  let orgTeamMatchIds: Set<number>;

  if (filterByOrg && organizationId) {
    const orgStandForms = await db
      .select({ teamMatchId: standForm.teamMatchId })
      .from(standForm)
      .innerJoin(member, eq(member.id, standForm.scoutMemberId))
      .where(
        and(
          inArray(standForm.teamMatchId, teamMatchIds),
          eq(member.organizationId, organizationId),
          isNotNull(standForm.scoutMemberId)
        )
      )
      .groupBy(standForm.teamMatchId);

    orgTeamMatchIds = new Set(orgStandForms.map((sf) => sf.teamMatchId));
    matches = allMatches.filter((m) => orgTeamMatchIds.has(m.teamMatchId));
  } else {
    orgTeamMatchIds = new Set(teamMatchIds);
  }

  if (matches.length === 0) {
    return [];
  }

  // Get consensus data filtered by organization (or all if not filtering)
  const orgScoutData =
    filterByOrg && organizationId
      ? await db
          .select({
            teamMatchId: vStandFormExpected.teamMatchId,
            expFuelActive: vStandFormExpected.expFuelActive,
            expTower: vStandFormExpected.expTower,
            clankMatch: vStandFormExpected.clankMatch,
          })
          .from(vStandFormExpected)
          .innerJoin(standForm, eq(standForm.id, vStandFormExpected.standFormId))
          .innerJoin(member, eq(member.id, standForm.scoutMemberId))
          .where(
            and(
              inArray(vStandFormExpected.teamMatchId, Array.from(orgTeamMatchIds)),
              eq(member.organizationId, organizationId),
              isNotNull(standForm.scoutMemberId)
            )
          )
      : await db
          .select({
            teamMatchId: vStandFormExpected.teamMatchId,
            expFuelActive: vStandFormExpected.expFuelActive,
            expTower: vStandFormExpected.expTower,
            clankMatch: vStandFormExpected.clankMatch,
          })
          .from(vStandFormExpected)
          .where(inArray(vStandFormExpected.teamMatchId, Array.from(orgTeamMatchIds)));

  // Calculate median consensus per team match
  const consensusByMatch = new Map<number, typeof orgScoutData>();
  for (const row of orgScoutData) {
    const existing = consensusByMatch.get(row.teamMatchId) ?? [];
    existing.push(row);
    consensusByMatch.set(row.teamMatchId, existing);
  }

  const consensusMap = new Map<
    number,
    {
      expFuelActive: number;
      expTower: number;
      clank: number;
      nScouts: number;
    }
  >();

  for (const [teamMatchId, values] of Array.from(consensusByMatch.entries())) {
    if (values.length > 0) {
      const sortedFuel = values
        .map((v: { expFuelActive: string }) => Number(v.expFuelActive))
        .sort((a: number, b: number) => a - b);
      const sortedTower = values
        .map((v: { expTower: string }) => Number(v.expTower))
        .sort((a: number, b: number) => a - b);
      const sortedClank = values
        .map((v: { clankMatch: string }) => Number(v.clankMatch))
        .sort((a: number, b: number) => a - b);

      const medianFuel = sortedFuel[Math.floor(sortedFuel.length / 2)] ?? 0;
      const medianTower = sortedTower[Math.floor(sortedTower.length / 2)] ?? 0;
      const medianClank = sortedClank[Math.floor(sortedClank.length / 2)] ?? 0;

      consensusMap.set(teamMatchId, {
        expFuelActive: medianFuel,
        expTower: medianTower,
        clank: medianClank,
        nScouts: values.length,
      });
    }
  }

  const orgTeamMatchIdsArray = Array.from(orgTeamMatchIds);

  // Get cycle summaries (filtered by org if needed)
  const cycleData =
    filterByOrg && organizationId
      ? await db
          .select({
            teamMatchId: standForm.teamMatchId,
            phase: cycle.phase,
            count: sql<number>`count(*)::int`,
          })
          .from(cycle)
          .innerJoin(standForm, eq(standForm.id, cycle.standFormId))
          .innerJoin(member, eq(member.id, standForm.scoutMemberId))
          .where(
            and(
              inArray(standForm.teamMatchId, orgTeamMatchIdsArray),
              eq(member.organizationId, organizationId),
              isNotNull(standForm.scoutMemberId)
            )
          )
          .groupBy(standForm.teamMatchId, cycle.phase)
      : await db
          .select({
            teamMatchId: standForm.teamMatchId,
            phase: cycle.phase,
            count: sql<number>`count(*)::int`,
          })
          .from(cycle)
          .innerJoin(standForm, eq(standForm.id, cycle.standFormId))
          .where(inArray(standForm.teamMatchId, orgTeamMatchIdsArray))
          .groupBy(standForm.teamMatchId, cycle.phase);

  // Get climb summaries (filtered by org if needed)
  const climbData =
    filterByOrg && organizationId
      ? await db
          .select({
            teamMatchId: standForm.teamMatchId,
            climbLevel: sql<number>`avg(${climb.climbLevel})`,
            climbSuccess: sql<number>`avg(case when ${climb.climbSuccess} then 1.0 else 0.0 end)`,
            climbDuration: sql<number>`avg(${climb.climbDuration})`,
            totalAttempts: sql<number>`count(*)::int`,
          })
          .from(climb)
          .innerJoin(standForm, eq(standForm.id, climb.standFormId))
          .innerJoin(member, eq(member.id, standForm.scoutMemberId))
          .where(
            and(
              inArray(standForm.teamMatchId, orgTeamMatchIdsArray),
              eq(member.organizationId, organizationId),
              isNotNull(standForm.scoutMemberId)
            )
          )
          .groupBy(standForm.teamMatchId)
      : await db
          .select({
            teamMatchId: standForm.teamMatchId,
            climbLevel: sql<number>`avg(${climb.climbLevel})`,
            climbSuccess: sql<number>`avg(case when ${climb.climbSuccess} then 1.0 else 0.0 end)`,
            climbDuration: sql<number>`avg(${climb.climbDuration})`,
            totalAttempts: sql<number>`count(*)::int`,
          })
          .from(climb)
          .innerJoin(standForm, eq(standForm.id, climb.standFormId))
          .where(inArray(standForm.teamMatchId, orgTeamMatchIdsArray))
          .groupBy(standForm.teamMatchId);

  const cycleMap = new Map<number, { auto: number; teleop: number }>();
  for (const cd of cycleData) {
    const existing = cycleMap.get(cd.teamMatchId) ?? { auto: 0, teleop: 0 };
    if (cd.phase === "auto") {
      existing.auto = Number(cd.count);
    } else {
      existing.teleop = Number(cd.count);
    }
    cycleMap.set(cd.teamMatchId, existing);
  }

  const climbMap = new Map(
    climbData.map((c) => [
      c.teamMatchId,
      {
        avgLevel: Number(c.climbLevel),
        successRate: Number(c.climbSuccess),
        avgDuration: Number(c.climbDuration),
        totalAttempts: Number(c.totalAttempts),
      },
    ])
  );

  return matches.map((m) => {
    const consensus = consensusMap.get(m.teamMatchId);
    const cycles = cycleMap.get(m.teamMatchId) ?? { auto: 0, teleop: 0 };
    const climbs = climbMap.get(m.teamMatchId) ?? {
      avgLevel: 0,
      successRate: 0,
      avgDuration: 0,
      totalAttempts: 0,
    };

    return {
      teamMatchId: m.teamMatchId,
      matchId: m.matchId,
      matchType: m.matchType,
      matchNumber: m.matchNumber,
      eventCode: m.eventCode,
      eventName: m.eventName,
      alliance: m.alliance,
      position: m.position,
      expFuelActive: consensus ? Number(consensus.expFuelActive) : 0,
      expTower: consensus ? Number(consensus.expTower) : 0,
      clank: consensus ? Number(consensus.clank) : 0,
      nScouts: consensus ? consensus.nScouts : 0,
      cycleSummary: {
        autoCycles: cycles.auto,
        teleopCycles: cycles.teleop,
        totalCycles: cycles.auto + cycles.teleop,
      },
      climbSummary: {
        successRate: climbs.successRate,
        avgLevel: climbs.avgLevel,
        avgDuration: climbs.avgDuration,
        totalAttempts: climbs.totalAttempts,
      },
    };
  });
}

export async function getTeamMatchDetails(
  teamMatchId: number,
  organizationId: string | null,
  filterByOrg: boolean = true
): Promise<MatchDetails | null> {
  if (filterByOrg && !organizationId) {
    return null;
  }

  // Get cycles (filtered by org if needed)
  const cycles =
    filterByOrg && organizationId
      ? await db
          .select({
            id: cycle.id,
            phase: cycle.phase,
            cycleNumber: cycle.cycleNumber,
            bucket: cycle.bucket,
            dumpDuration: cycle.dumpDuration,
          })
          .from(cycle)
          .innerJoin(standForm, eq(standForm.id, cycle.standFormId))
          .innerJoin(member, eq(member.id, standForm.scoutMemberId))
          .where(
            and(
              eq(standForm.teamMatchId, teamMatchId),
              eq(member.organizationId, organizationId),
              isNotNull(standForm.scoutMemberId)
            )
          )
          .orderBy(asc(cycle.cycleNumber))
      : await db
          .select({
            id: cycle.id,
            phase: cycle.phase,
            cycleNumber: cycle.cycleNumber,
            bucket: cycle.bucket,
            dumpDuration: cycle.dumpDuration,
          })
          .from(cycle)
          .innerJoin(standForm, eq(standForm.id, cycle.standFormId))
          .where(eq(standForm.teamMatchId, teamMatchId))
          .orderBy(asc(cycle.cycleNumber));

  // Get climbs (filtered by org if needed)
  const climbs =
    filterByOrg && organizationId
      ? await db
          .select({
            id: climb.id,
            climbLevel: climb.climbLevel,
            climbSuccess: climb.climbSuccess,
            climbDuration: climb.climbDuration,
            climbPhase: climb.climbPhase,
          })
          .from(climb)
          .innerJoin(standForm, eq(standForm.id, climb.standFormId))
          .innerJoin(member, eq(member.id, standForm.scoutMemberId))
          .where(
            and(
              eq(standForm.teamMatchId, teamMatchId),
              eq(member.organizationId, organizationId),
              isNotNull(standForm.scoutMemberId)
            )
          )
          .orderBy(asc(climb.createdAt))
      : await db
          .select({
            id: climb.id,
            climbLevel: climb.climbLevel,
            climbSuccess: climb.climbSuccess,
            climbDuration: climb.climbDuration,
            climbPhase: climb.climbPhase,
          })
          .from(climb)
          .innerJoin(standForm, eq(standForm.id, climb.standFormId))
          .where(eq(standForm.teamMatchId, teamMatchId))
          .orderBy(asc(climb.createdAt));

  return {
    cycles: cycles.map((c) => ({
      id: c.id,
      phase: c.phase,
      cycleNumber: c.cycleNumber,
      bucket: c.bucket,
      dumpDuration: Number(c.dumpDuration),
    })),
    climbs: climbs.map((c) => ({
      id: c.id,
      climbLevel: c.climbLevel,
      climbSuccess: c.climbSuccess,
      climbDuration: Number(c.climbDuration),
      climbPhase: c.climbPhase,
    })),
  };
}

export async function getTeamInfo(teamNumber: number) {
  const teamData = await db.query.team.findFirst({
    where: (team, { eq }) => eq(team.teamNumber, teamNumber),
  });

  return teamData;
}

export interface PitPhotoItem {
  storageKey: string;
  index: number;
  /** Short-lived token for /pit-photo so image optimizer can load without cookies */
  viewToken: string;
}

/**
 * Pit photos for a team from your organization's pit forms only.
 * Returns empty array if no organization or no photos.
 */
export async function getTeamPitPhotos(
  teamNumber: number,
  organizationId: string | null
): Promise<PitPhotoItem[]> {
  if (!organizationId) return [];

  const rows = await db
    .select({
      storageKey: pitPhoto.storageKey,
      index: pitPhoto.index,
    })
    .from(pitPhoto)
    .innerJoin(pitForm, eq(pitForm.id, pitPhoto.pitFormId))
    .innerJoin(member, eq(member.id, pitForm.scoutMemberId))
    .where(
      and(
        eq(pitForm.teamNumber, teamNumber),
        eq(member.organizationId, organizationId),
        isNotNull(pitForm.scoutMemberId)
      )
    )
    .orderBy(asc(pitPhoto.index));

  return rows.map((row) => ({
    storageKey: row.storageKey,
    index: row.index,
    viewToken: createPitPhotoViewToken(row.storageKey),
  }));
}
