import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { team, teamMatch } from "@/lib/database/schema";

export async function getEventTeams(eventId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.eventTeams(eventId));

  return db
    .selectDistinct({
      teamNumber: team.teamNumber,
      teamName: team.teamName,
    })
    .from(teamMatch)
    .innerJoin(team, eq(team.teamNumber, teamMatch.teamNumber))
    .where(eq(teamMatch.eventId, eventId))
    .orderBy(asc(team.teamNumber));
}
