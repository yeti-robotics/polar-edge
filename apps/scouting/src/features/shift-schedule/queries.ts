import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { match, shiftSchedule } from "@/lib/database/schema";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { normalizeShiftScheduleEntries, type ShiftScheduleEntry } from "./types";

export async function getShiftScheduleForActiveEvent(organizationId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.shiftSchedule(organizationId));

  const activeEvent = await getActiveEventForOrganization(organizationId);

  if (!activeEvent?.event) {
    return {
      activeEvent: null,
      entries: [] as ShiftScheduleEntry[],
      matchNumbers: [] as number[],
    };
  }

  cacheTag(cacheTags.eventMatchNumbers(activeEvent.event.id));

  const [scheduleRows, matchRows] = await Promise.all([
    db
      .select({ scheduleData: shiftSchedule.scheduleData })
      .from(shiftSchedule)
      .where(
        and(
          eq(shiftSchedule.organizationId, organizationId),
          eq(shiftSchedule.eventId, activeEvent.event.id)
        )
      )
      .limit(1),
    db
      .selectDistinct({ matchNumber: match.matchNumber })
      .from(match)
      .where(and(eq(match.eventId, activeEvent.event.id), eq(match.matchType, "qm")))
      .orderBy(asc(match.matchNumber)),
  ]);
  const raw = scheduleRows[0]?.scheduleData;
  const scheduleData =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : undefined;

  return {
    activeEvent: activeEvent.event,
    entries: normalizeShiftScheduleEntries(scheduleData?.entries),
    matchNumbers: matchRows.map((row) => row.matchNumber),
  };
}
