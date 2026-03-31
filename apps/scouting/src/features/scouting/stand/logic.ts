import { and, eq } from "drizzle-orm";
import { db } from "@/lib/database";
import { climb, cycle, match, standForm, teamMatch } from "@/lib/database/schema";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import type { StandFormSubmission } from "./types";

/**
 * Lookup teamMatchId by match number and team number.
 * Queries within the active event for the given organization.
 */
export async function lookupTeamMatch(
  matchNumber: number,
  teamNumber: number,
  organizationId: string
) {
  const activeEvent = await getActiveEventForOrganization(organizationId);
  if (!activeEvent?.event) {
    return { error: "No active event for this organization" };
  }

  const matchResult = await db
    .select({ id: match.id })
    .from(match)
    .where(and(eq(match.eventId, activeEvent.event.id), eq(match.matchNumber, matchNumber)))
    .limit(1);

  if (matchResult.length === 0) {
    return { error: `Match ${matchNumber} not found in active event` };
  }

  const matchRecord = matchResult[0];
  if (!matchRecord) {
    return { error: `Match ${matchNumber} not found in active event` };
  }

  const teamMatchResult = await db
    .select({ id: teamMatch.id })
    .from(teamMatch)
    .where(and(eq(teamMatch.matchId, matchRecord.id), eq(teamMatch.teamNumber, teamNumber)))
    .limit(1);

  if (teamMatchResult.length === 0) {
    return { error: `Team ${teamNumber} not found in match ${matchNumber}` };
  }

  const teamMatchRecord = teamMatchResult[0];
  if (!teamMatchRecord) {
    return { error: `Team ${teamNumber} not found in match ${matchNumber}` };
  }

  return { teamMatchId: teamMatchRecord.id };
}

/**
 * Submit stand form with atomic transaction.
 * Inserts stand_form + cycles + climbs in a single transaction.
 */
export async function submitStandForm(
  data: StandFormSubmission,
  memberId: string,
  organizationId: string
) {
  const activeEvent = await getActiveEventForOrganization(organizationId);
  if (!activeEvent?.event) {
    return { error: "No active event" };
  }

  const validTeamMatch = await db
    .select({ id: teamMatch.id, teamNumber: teamMatch.teamNumber })
    .from(teamMatch)
    .innerJoin(match, eq(teamMatch.matchId, match.id))
    .where(and(eq(teamMatch.id, data.teamMatchId), eq(match.eventId, activeEvent.event.id)))
    .limit(1);

  if (validTeamMatch.length === 0) {
    return { error: "Invalid match for current event" };
  }

  await db.transaction(async (tx) => {
    const [standFormRecord] = await tx
      .insert(standForm)
      .values({
        teamMatchId: data.teamMatchId,
        scoutMemberId: memberId,
        comments: data.comments,
        oofTimeSeconds: data.oofTimeSeconds,
      })
      .returning();

    if (!standFormRecord) {
      throw new Error("Failed to create stand form");
    }

    if (data.cycles.length > 0) {
      await tx.insert(cycle).values(
        data.cycles.map((c) => ({
          standFormId: standFormRecord.id,
          phase: c.phase,
          cycleNumber: c.cycleNumber,
          bucket: c.bucket,
          dumpDuration: ((c.endedAt - c.startedAt) / 1000).toString(),
        }))
      );
    }

    if (data.climbs.length > 0) {
      await tx.insert(climb).values(
        data.climbs.map((c) => ({
          standFormId: standFormRecord.id,
          climbPhase: c.phase,
          climbLevel: c.climbLevel,
          climbSuccess: c.climbSuccess,
          climbDuration: ((c.endedAt - c.startedAt) / 1000).toString(),
        }))
      );
    }
  });

  return {
    success: true,
    eventId: activeEvent.event.id,
    teamNumber: validTeamMatch[0]?.teamNumber,
  };
}
