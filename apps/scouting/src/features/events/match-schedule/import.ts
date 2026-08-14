import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/database";
import { event } from "@/lib/database/schema/tables";
import type {
  ImportResult,
  MatchSchedule,
} from "./types";

export async function importMatchSchedule(
  schedule: MatchSchedule,
): Promise<ImportResult> {
  return db.transaction(async (tx) => {
    let eventId: string;

    if (schedule.event.mode === "create-or-update") {
      const [upsertedEvent] = await tx
        .insert(event)
        .values({
          eventCode: schedule.event.eventCode,
          name: schedule.event.name,
          startDate: schedule.event.startDate,
          endDate: schedule.event.endDate,
        })
        .onConflictDoUpdate({
          target: event.eventCode,
          set: {
            name: schedule.event.name,
            startDate: schedule.event.startDate,
            endDate: schedule.event.endDate,
          },
        })
        .returning({
          id: event.id,
        });

      if (!upsertedEvent) {
        throw new Error("Failed to create or update event");
      }

      eventId = upsertedEvent.id;
    } else {
      const [existingEvent] = await tx
        .select({
          id: event.id,
        })
        .from(event)
        .where(eq(event.eventCode, schedule.event.eventCode))
        .limit(1);

      if (!existingEvent) {
        throw new Error(
          `Event ${schedule.event.eventCode} does not exist`,
        );
      }

      eventId = existingEvent.id;
    }

    return {
      eventId,
      matchCount: 0,
      teamMatchCount: 0,
    };
  });
}
