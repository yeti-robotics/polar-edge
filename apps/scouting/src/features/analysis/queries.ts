import "server-only";

import { and, countDistinct, eq, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  climb,
  cycle,
  match,
  member,
  pitForm,
  standForm,
  team,
  teamMatch,
  user,
} from "@/lib/database/schema/tables";

export type AdminFormRow = {
  id: string;
  type: "stand" | "pit";
  teamNumber: number;
  matchType: string | null;
  matchNumber: number | null;
  alliance: string | null;
  position: number | null;
  scoutName: string | null;
  createdAt: Date;
};

export async function getTeamCount(): Promise<number> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.teamsList);

  const result = await db.select({ count: countDistinct(team.teamNumber) }).from(team);
  return result[0]?.count ?? 0;
}

export async function getStandFormCount(): Promise<number> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.analysisStandFormCount);

  const result = await db
    .select({ count: countDistinct(standForm.id) })
    .from(standForm)
    .where(isNull(standForm.deletedAt));
  return result[0]?.count ?? 0;
}

export async function getPitFormCount(): Promise<number> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.analysisPitFormCount);

  const result = await db.select({ count: countDistinct(pitForm.id) }).from(pitForm);
  return result[0]?.count ?? 0;
}

/**
 * List all submitted forms (stand + pit) scoped to an organization.
 * Supports basic server-side filtering by organizationId only (client can filter further).
 */
export async function getAllFormSubmissions(organizationId: string): Promise<AdminFormRow[]> {
  "use cache";
  cacheLife("minutes");

  const [standRows, pitRows] = await Promise.all([
    db
      .select({
        type: sql<"stand">`'stand'`.as("type"),
        id: standForm.id,
        teamNumber: teamMatch.teamNumber,
        matchType: match.matchType,
        matchNumber: match.matchNumber,
        alliance: teamMatch.alliance,
        position: teamMatch.position,
        scoutName: user.name,
        createdAt: standForm.createdAt,
      })
      .from(standForm)
      .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
      .innerJoin(match, eq(match.id, teamMatch.matchId))
      .innerJoin(
        member,
        and(eq(member.id, standForm.scoutMemberId), eq(member.organizationId, organizationId))
      )
      .leftJoin(user, eq(user.id, member.userId))
      .where(isNull(standForm.deletedAt)),

    db
      .select({
        type: sql<"pit">`'pit'`.as("type"),
        id: pitForm.id,
        teamNumber: pitForm.teamNumber,
        matchType: sql<null>`null`.as("matchType"),
        matchNumber: sql<null>`null`.as("matchNumber"),
        alliance: sql<null>`null`.as("alliance"),
        position: sql<null>`null`.as("position"),
        scoutName: user.name,
        createdAt: pitForm.createdAt,
      })
      .from(pitForm)
      .innerJoin(
        member,
        and(eq(member.id, pitForm.scoutMemberId), eq(member.organizationId, organizationId))
      )
      .leftJoin(user, eq(user.id, member.userId)),
  ]);

  const normalized: AdminFormRow[] = [...standRows, ...pitRows]
    .map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        type: (row.type as "stand" | "pit") || "stand",
        teamNumber: Number(row.teamNumber),
        matchType: row.matchType == null ? null : String(row.matchType),
        matchNumber: row.matchNumber == null ? null : Number(row.matchNumber),
        alliance: row.alliance == null ? null : String(row.alliance),
        position: row.position == null ? null : Number(row.position),
        scoutName: row.scoutName == null ? null : String(row.scoutName),
        createdAt: row.createdAt as Date,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return normalized;
}

/**
 * Return full form payload for a given form id and type. Requires admin membership.
 */
export async function getFormSubmissionById(
  formId: string,
  type: "stand" | "pit"
): Promise<Record<string, unknown> | null> {
  "use server";
  // lazy import server helpers to avoid circular deps in client bundles
  const { requireAdminMember } = await import("@/lib/server/auth/require-member");
  const activeMember = await requireAdminMember();
  const { organizationId } = activeMember;

  if (type === "stand") {
    // join stand_form -> team_match -> match -> member -> user, include cycles and climbs
    const standRows = await db
      .select({
        id: standForm.id,
        teamMatchId: standForm.teamMatchId,
        scoutMemberId: standForm.scoutMemberId,
        comments: standForm.comments,
        oofTimeSeconds: standForm.oofTimeSeconds,
        createdAt: standForm.createdAt,
        teamNumber: teamMatch.teamNumber,
        matchType: match.matchType,
        matchNumber: match.matchNumber,
        alliance: teamMatch.alliance,
        position: teamMatch.position,
        scoutName: user.name,
      })
      .from(standForm)
      .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
      .innerJoin(match, eq(match.id, teamMatch.matchId))
      .innerJoin(
        member,
        and(eq(member.id, standForm.scoutMemberId), eq(member.organizationId, organizationId))
      )
      .leftJoin(user, eq(user.id, member.userId))
      .where(eq(standForm.id, formId))
      .limit(1);

    if (!standRows[0]) return null;

    const stand = standRows[0] as Record<string, unknown>;

      let cycles: unknown[] = [];
      let climbs: unknown[] = [];
      let cyclesError: string | null = null;
      let climbsError: string | null = null;

      try {
        cycles = await db.select().from(cycle).where(eq(cycle.standFormId, formId)).orderBy(cycle.createdAt);
      } catch (err) {
        cyclesError = `Failed to load cycles for form ${formId}: ${err instanceof Error ? err.message : String(err)}`;
        // keep cycles as empty array so UI can still render main payload
        cycles = [];
      }

      try {
        climbs = await db.select().from(climb).where(eq(climb.standFormId, formId)).orderBy(climb.createdAt);
      } catch (err) {
        climbsError = `Failed to load climbs for form ${formId}: ${err instanceof Error ? err.message : String(err)}`;
        climbs = [];
      }

      return { ...stand, cycles, climbs, cyclesError, climbsError };
  }

  // pit form
  const pitRows = await db
    .select({
      id: pitForm.id,
      teamNumber: pitForm.teamNumber,
      drivetrainType: pitForm.drivetrainType,
      canTrench: pitForm.canTrench,
      canBump: pitForm.canBump,
      canShuttle: pitForm.canShuttle,
      capacity: pitForm.capacity,
      weight: pitForm.weight,
      climbType: pitForm.climbType,
      shooterType: pitForm.shooterType,
      canShootWhileMoving: pitForm.canShootWhileMoving,
      createdAt: pitForm.createdAt,
      scoutName: user.name,
    })
    .from(pitForm)
    .innerJoin(
      member,
      and(eq(member.id, pitForm.scoutMemberId), eq(member.organizationId, organizationId))
    )
    .leftJoin(user, eq(user.id, member.userId))
    .where(eq(pitForm.id, formId))
    .limit(1);

  if (!pitRows[0]) return null;
  return pitRows[0] as Record<string, unknown>;
}
