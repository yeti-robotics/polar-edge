import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/database";
import { shiftSchedule } from "@/lib/database/schema";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import type { ShiftScheduleEntry } from "./types";

export async function getShiftScheduleForActiveEvent(organizationId: string) {
  const activeEvent = await getActiveEventForOrganization(organizationId);
  if (!activeEvent?.event) {
    return { activeEvent: null, entries: [] as ShiftScheduleEntry[] };
  }

  let schedule = null;
  try {
    schedule = await db.query.shiftSchedule.findFirst({
      where: and(
        eq(shiftSchedule.organizationId, organizationId),
        eq(shiftSchedule.eventId, activeEvent.event.id)
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const causeMessage =
      error && typeof error === "object" && "cause" in error && error.cause instanceof Error
        ? error.cause.message
        : "";
    if (
      message.includes('relation "shift_schedule" does not exist') ||
      causeMessage.includes('relation "shift_schedule" does not exist')
    ) {
      return { activeEvent: activeEvent.event, entries: [] as ShiftScheduleEntry[] };
    }
    throw error;
  }

  const scheduleData = schedule?.scheduleData as { entries?: ShiftScheduleEntry[] } | null;
  const entries = Array.isArray(scheduleData?.entries) ? scheduleData.entries : [];

  return { activeEvent: activeEvent.event, entries };
}
