import "server-only";

import { and, countDistinct, eq, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
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
