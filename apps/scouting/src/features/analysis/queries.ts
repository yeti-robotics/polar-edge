import "server-only";

import { and, countDistinct, eq, isNull } from "drizzle-orm";
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
    db
      .select({ count: countDistinct(standForm.id) })
      .from(standForm)
      .where(and(eq(standForm.scoutMemberId, memberId), isNull(standForm.deletedAt))),
    db
      .select({ count: countDistinct(pitForm.id) })
      .from(pitForm)
      .where(eq(pitForm.scoutMemberId, memberId)),
  ]);

  const standCount = standCountRow[0]?.count ?? 0;
  const pitCount = pitCountRow[0]?.count ?? 0;

  return {
    standCount,
    pitCount,
    total: standCount + pitCount,
  };
}

export async function getUserFormSubmissions(memberId: string): Promise<UserFormSubmission[]> {
  const [standForms, pitForms] = await Promise.all([
    db
      .select({
        id: standForm.id,
        createdAt: standForm.createdAt,
        teamNumber: teamMatch.teamNumber,
        matchNumber: match.matchNumber,
        matchType: match.matchType,
      })
      .from(standForm)
      .innerJoin(teamMatch, eq(standForm.teamMatchId, teamMatch.id))
      .innerJoin(match, eq(teamMatch.matchId, match.id))
      .where(and(eq(standForm.scoutMemberId, memberId), isNull(standForm.deletedAt))),
    db
      .select({
        id: pitForm.id,
        createdAt: pitForm.createdAt,
        teamNumber: pitForm.teamNumber,
      })
      .from(pitForm)
      .where(eq(pitForm.scoutMemberId, memberId)),
  ]);

  const normalizedStand = standForms.map((row) => ({
    id: row.id,
    type: "stand" as const,
    createdAt: row.createdAt,
    teamNumber: row.teamNumber,
    matchNumber: row.matchNumber,
    matchType: row.matchType,
  }));

  const normalizedPit = pitForms.map((row) => ({
    id: row.id,
    type: "pit" as const,
    createdAt: row.createdAt,
    teamNumber: row.teamNumber,
    matchNumber: null,
    matchType: null,
  }));

  return [...normalizedStand, ...normalizedPit].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}
