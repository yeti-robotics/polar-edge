import "server-only";

import { eq ,sql} from "drizzle-orm";
import { db } from "@/lib/database";
import { event, team } from "@/lib/database/schema/tables";
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

     const teamNamesByNumber = new Map<number, string>();

     for (const scheduledMatch of schedule.matches) {
        for (const slot of scheduledMatch.slots) {
           const knownName = slot.teamName?.trim();
           if(knownName)
           {
              teamNamesByNumber.set(Number(slot.teamNumber), knownName);
           } else if (!teamNamesByNumber.has(slot.teamNumber))
           {
              teamNamesByNumber.set(slot.teamNumber, "")
           }
        }
     }


     const teamValues = [...teamNamesByNumber].map(
        ([teamNumber, teamName]) => ({ teamNumber, teamName }));


     if (teamValues.length > 0) {
        await tx
           .insert(team)
           .values(teamValues)
           .onConflictDoUpdate({
              target: team.teamNumber,
              set: {
                 teamName: sql`
                    case
                    when excluded.team_name <> ''
                    then excluded.team_name
                    else ${team.teamName}
                    end
                    `
              }
           })
     }




    return {
      eventId: eventId,
      matchCount: 0,
      teamMatchCount: 0,
    };
  });
}
