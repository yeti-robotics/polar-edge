import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/database";
import { match, shiftSchedule } from "@/lib/database/schema";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { normalizeShiftScheduleEntries, type ShiftScheduleEntry } from "./types";

export async function getShiftScheduleForActiveEvent(organizationId: string) {
  const activeEvent = await getActiveEventForOrganization(organizationId);

  if (!activeEvent?.event) {
    return {
      activeEvent: null,
      entries: [] as ShiftScheduleEntry[],
      matchNumbers: [] as number[],
    };
  }

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
      .where(eq(match.eventId, activeEvent.event.id))
      .orderBy(asc(match.matchNumber)),
  ]);

  const scheduleData = scheduleRows[0]?.scheduleData as { entries?: unknown } | undefined;

  return {
    activeEvent: activeEvent.event,
    entries: normalizeShiftScheduleEntries(scheduleData?.entries),
    matchNumbers: matchRows.map((row) => row.matchNumber),
  };
}
