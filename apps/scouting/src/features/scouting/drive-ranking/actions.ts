"use server";

import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { driveTeamRanking, driveTeamRankingEntry, match, team, teamMatch } from "@/lib/database/schema";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { DriveRankingSubmissionSchema } from "./types";

export async function lookupAllianceTeams(matchNumber: number, alliance: "red" | "blue") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "Unauthorized" };

  const activeMember = await auth.api.getActiveMember({ headers: await headers() });
  if (!activeMember?.organizationId) return { error: "No active organization" };

  const hasPermission = await auth.api.hasPermission({
    headers: await headers(),
    body: { permissions: { driveRanking: ["create"] } },
  });
  if (!hasPermission.success) return { error: "Insufficient permissions" };

  const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);
  if (!activeEvent?.event) return { error: "No active event" };

  const matchResult = await db
    .select({ id: match.id })
    .from(match)
    .where(and(eq(match.eventId, activeEvent.event.id), eq(match.matchNumber, matchNumber)))
    .limit(1);

  const matchRecord = matchResult[0];
  if (!matchRecord) return { error: `Match ${matchNumber} not found in active event` };

  const teams = await db
    .select({
      teamNumber: teamMatch.teamNumber,
      teamName: team.teamName,
      position: teamMatch.position,
    })
    .from(teamMatch)
    .innerJoin(team, eq(team.teamNumber, teamMatch.teamNumber))
    .where(and(eq(teamMatch.matchId, matchRecord.id), eq(teamMatch.alliance, alliance)))
    .orderBy(teamMatch.position);

  if (teams.length === 0) return { error: `No ${alliance} teams found for match ${matchNumber}` };

  // Check if a ranking already exists for this org
  const existing = await db
    .select({ id: driveTeamRanking.id })
    .from(driveTeamRanking)
    .where(
      and(
        eq(driveTeamRanking.matchId, matchRecord.id),
        eq(driveTeamRanking.alliance, alliance),
        eq(driveTeamRanking.organizationId, activeMember.organizationId)
      )
    )
    .limit(1);

  return {
    matchId: matchRecord.id,
    teams: teams.map((t) => ({ teamNumber: t.teamNumber, teamName: t.teamName })),
    alreadyRanked: existing.length > 0,
  };
}

export async function submitDriveRanking(data: unknown) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: "Unauthorized" };

    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (!activeMember) return { error: "No active member" };

    const hasPermission = await auth.api.hasPermission({
      headers: await headers(),
      body: { permissions: { driveRanking: ["create"] } },
    });
    if (!hasPermission.success) return { error: "Insufficient permissions" };

    const validated = DriveRankingSubmissionSchema.safeParse(data);
    if (!validated.success) return { error: "Invalid input" };

    const { matchNumber, alliance, rankings } = validated.data;

    const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);
    if (!activeEvent?.event) return { error: "No active event" };

    const matchResult = await db
      .select({ id: match.id })
      .from(match)
      .where(and(eq(match.eventId, activeEvent.event.id), eq(match.matchNumber, matchNumber)))
      .limit(1);

    const matchRecord = matchResult[0];
    if (!matchRecord) return { error: `Match ${matchNumber} not found` };

    // Verify all teams are actually in this match on this alliance
    const matchTeams = await db
      .select({ teamNumber: teamMatch.teamNumber })
      .from(teamMatch)
      .where(and(eq(teamMatch.matchId, matchRecord.id), eq(teamMatch.alliance, alliance)));

    const matchTeamNumbers = new Set(matchTeams.map((t) => t.teamNumber));
    for (const teamNum of rankings) {
      if (!matchTeamNumbers.has(teamNum)) {
        return { error: `Team ${teamNum} is not on ${alliance} alliance in match ${matchNumber}` };
      }
    }

    await db.transaction(async (tx) => {
      // Upsert: delete existing ranking for this match/alliance/org, then insert
      await tx
        .delete(driveTeamRanking)
        .where(
          and(
            eq(driveTeamRanking.matchId, matchRecord.id),
            eq(driveTeamRanking.alliance, alliance),
            eq(driveTeamRanking.organizationId, activeMember.organizationId)
          )
        );

      const [rankingRecord] = await tx
        .insert(driveTeamRanking)
        .values({
          matchId: matchRecord.id,
          alliance,
          organizationId: activeMember.organizationId,
          scoutMemberId: activeMember.id,
        })
        .returning();

      if (!rankingRecord) throw new Error("Failed to create ranking");

      await tx.insert(driveTeamRankingEntry).values(
        rankings.map((teamNumber, index) => ({
          rankingId: rankingRecord.id,
          teamNumber,
          rank: (index + 1) as 1 | 2 | 3,
        }))
      );
    });

    revalidateTag(cacheTags.driveRanking(activeMember.organizationId), "max");

    return { success: true };
  } catch (error) {
    console.error("Submit drive ranking error:", error);
    return { error: "Failed to submit ranking" };
  }
}
