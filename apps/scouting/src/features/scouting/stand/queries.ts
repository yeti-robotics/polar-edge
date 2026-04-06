import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { db } from "@/lib/database";
import { match } from "@/lib/database/schema";

export async function getEventMatchNumbers(eventId: string) {
  "use cache";
  cacheLife("hours");

  const matchRows = await db
    .selectDistinct({ matchNumber: match.matchNumber })
    .from(match)
    .where(eq(match.eventId, eventId))
    .orderBy(asc(match.matchNumber));

  return matchRows.map((row) => row.matchNumber);
}
