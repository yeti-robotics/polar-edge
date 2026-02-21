"use server";

import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { climb, cycle, match, standForm, teamMatch } from "@/lib/database/schema";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { StandFormSchema } from "./types";

/**
 * Server action to lookup teamMatchId by match number and team number.
 * Queries within the active event for the user's organization.
 */
export async function lookupTeamMatch(matchNumber: number, teamNumber: number) {
  try {
    // Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Get active member and organization
    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (!activeMember?.organizationId) {
      return { error: "No active organization" };
    }

    // Get active event for organization
    const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);
    if (!activeEvent?.event) {
      return { error: "No active event for this organization" };
    }

    // Find the match within the active event
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

    // Find team_match record
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
  } catch (error) {
    console.error("Lookup team match error:", error);
    return { error: "Failed to lookup match" };
  }
}

/**
 * Server action to submit stand form with atomic transaction.
 * Inserts stand_form + cycles + climbs in a single transaction.
 */
export async function submitStandForm(data: unknown) {
  try {
    // Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Get active member
    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (!activeMember) {
      return { error: "No active member" };
    }

    // Validate with Zod
    const validated = StandFormSchema.parse(data);

    // Validate teamMatchId belongs to the org's active event
    const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);
    if (!activeEvent?.event) {
      return { error: "No active event" };
    }

    const validTeamMatch = await db
      .select({ id: teamMatch.id })
      .from(teamMatch)
      .innerJoin(match, eq(teamMatch.matchId, match.id))
      .where(and(eq(teamMatch.id, validated.teamMatchId), eq(match.eventId, activeEvent.event.id)))
      .limit(1);

    if (validTeamMatch.length === 0) {
      return { error: "Invalid match for current event" };
    }

    // Database transaction (all-or-nothing)
    await db.transaction(async (tx) => {
      // Insert stand_form
      const [standFormRecord] = await tx
        .insert(standForm)
        .values({
          teamMatchId: validated.teamMatchId,
          scoutMemberId: activeMember.id,
          comments: validated.comments,
          oofTimeSeconds: validated.oofTimeSeconds,
        })
        .returning();

      if (!standFormRecord) {
        throw new Error("Failed to create stand form");
      }

      // Insert cycles (if any)
      if (validated.cycles.length > 0) {
        await tx.insert(cycle).values(
          validated.cycles.map((c) => ({
            standFormId: standFormRecord.id,
            phase: c.phase,
            cycleNumber: c.cycleNumber,
            bucket: c.bucket,
            dumpDuration: ((c.endedAt - c.startedAt) / 1000).toString(),
          }))
        );
      }

      // Insert climbs (if any)
      if (validated.climbs.length > 0) {
        await tx.insert(climb).values(
          validated.climbs.map((c) => ({
            standFormId: standFormRecord.id,
            climbPhase: c.phase,
            climbLevel: c.climbLevel,
            climbSuccess: c.climbSuccess,
            climbDuration: ((c.endedAt - c.startedAt) / 1000).toString(),
          }))
        );
      }
    });

    revalidateTag(cacheTags.leaderboardStand(activeMember.organizationId), "max");
    revalidateTag(cacheTags.analysisStandFormCount, "max");
    return { success: true };
  } catch (error) {
    console.error("Submit stand form error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to submit form" };
  }
}
