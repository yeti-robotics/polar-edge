import "server-only";

import { countDistinct, isNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { pitForm, standForm, team } from "@/lib/database/schema/tables";

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
