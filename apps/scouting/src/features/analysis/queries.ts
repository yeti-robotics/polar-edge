import "server-only";

import { and, countDistinct, eq, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { UserFormCounts, UserFormSubmission } from "@/app/profile/types";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { match, pitForm, standForm, team, teamMatch } from "@/lib/database/schema/tables";

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

export async function getUserFormCounts(memberId: string): Promise<UserFormCounts> {
  const [standCountRow, pitCountRow] = await Promise.all([
export type UserFormCounts = {
  standCount: number;
  pitCount: number;
  total: number;
};

export async function getUserFormCounts(memberId: string): Promise<UserFormCounts> {
  "use cache";
  cacheLife("minutes");

  const [standRows, pitRows] = await Promise.all([
    db
      .select({ count: countDistinct(standForm.id) })
      .from(standForm)
      .where(and(eq(standForm.scoutMemberId, memberId), isNull(standForm.deletedAt))),
    db
      .select({ count: countDistinct(pitForm.id) })
      .from(pitForm)
      .where(eq(pitForm.scoutMemberId, memberId)),
  ]);

  const standCount = standRows[0]?.count ?? 0;
  const pitCount = pitRows[0]?.count ?? 0;
  return { standCount, pitCount, total: standCount + pitCount };
}

export type UserFormSubmission = {
  type: "stand" | "pit";
  id: string;
  teamNumber: number | null;
  matchType: string | null;
  matchNumber: number | null;
  createdAt: Date;
};

export async function getUserFormSubmissions(memberId: string): Promise<UserFormSubmission[]> {
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
        createdAt: standForm.createdAt,
      })
      .from(standForm)
      .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
      .innerJoin(match, eq(match.id, teamMatch.matchId))
      .where(and(eq(standForm.scoutMemberId, memberId), isNull(standForm.deletedAt))),
    db
      .select({
        type: sql<"pit">`'pit'`.as("type"),
        id: pitForm.id,
        teamNumber: pitForm.teamNumber,
        matchType: sql<null>`null`.as("matchType"),
        matchNumber: sql<null>`null`.as("matchNumber"),
        createdAt: pitForm.createdAt,
      })
      .from(pitForm)
      .where(eq(pitForm.scoutMemberId, memberId)),
  ]);

  return [...standRows, ...pitRows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
