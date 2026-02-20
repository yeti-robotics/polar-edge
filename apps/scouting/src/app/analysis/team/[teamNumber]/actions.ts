"use server";

import { asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/database";
import { team } from "@/lib/database/schema";

const MAX_RESULTS = 20;

export type TeamSearchResult = { teamNumber: number; teamName: string };

export async function searchTeams(q: string): Promise<TeamSearchResult[]> {
  const trimmed = q?.trim() ?? "";

  if (!trimmed) {
    return db
      .select({
        teamNumber: team.teamNumber,
        teamName: team.teamName,
      })
      .from(team)
      .orderBy(asc(team.teamNumber))
      .limit(MAX_RESULTS);
  }

  const searchPattern = `%${trimmed}%`;
  const searchNum = Number.parseInt(trimmed, 10);
  const isNumeric = !Number.isNaN(searchNum);
  const numericPrefix = /^\d+$/.test(trimmed) ? `${trimmed}%` : null;

  const whereClause =
    isNumeric && numericPrefix
      ? or(
          ilike(team.teamName, searchPattern),
          eq(team.teamNumber, searchNum),
          sql`${team.teamNumber}::text LIKE ${numericPrefix}`
        )
      : ilike(team.teamName, searchPattern);

  const teams = await db
    .select({
      teamNumber: team.teamNumber,
      teamName: team.teamName,
    })
    .from(team)
    .where(whereClause)
    .orderBy(asc(team.teamNumber))
    .limit(MAX_RESULTS);

  return teams;
}
