import "server-only";

import { eq ,sql} from "drizzle-orm";
import { db } from "@/lib/database";
import { event, team, match, teamMatch } from "@/lib/database/schema/tables";
import type {
  ImportResult,
  MatchSchedule,
} from "./types";
import { revalidatePath, revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { routes } from "@/lib/routes";

export async function importMatchSchedule(
  schedule: MatchSchedule,
): Promise<ImportResult> {
  const result = await db.transaction(async (tx) => {
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



     if (schedule.matches.length > 0) {
        await tx
           .insert(match)
           .values(
              schedule.matches.map((scheduledMatch) => ({
                 eventId,
                 matchType: scheduledMatch.matchType,
                 matchNumber: scheduledMatch.matchNumber,
                 redScore: scheduledMatch.redScore ?? null ,
                 blueScore: scheduledMatch.blueScore ?? null,
              }))
        ).onConflictDoUpdate({
           target: [
              match.eventId,
              match.matchNumber,
              match.matchType,
           ],
           set: {
              redScore: sql`
                 coalesce(excluded.red_score, ${match.redScore})
                 `,
              blueScore: sql`
                 coalesce(excluded.blue_score, ${match.blueScore})
                 `, // if new score is known apply is if null than keep the existing score logic here
           }
           })
     }

     const storedMatches = await tx.select({
        id: match.id,
        matchNumber: match.matchNumber,
        matchType: match.matchType,

     }).from(match)
        .where(eq(match.eventId, eventId))


     const matchIdByKey = new Map(
       storedMatches.map((storedMatch) => [
         `${storedMatch.matchNumber}:${storedMatch.matchType}`,
         storedMatch.id,
       ]),
     );


     type TeamMatchValue = {
        eventId: string;
        matchId: string;
        teamNumber: number;
        alliance: "red" | "blue";
        position: 1 | 2 | 3;
        surrogate: boolean;
     }


     const teamMatchRows: TeamMatchValue[] = [];

     for (const scheduledMatch of schedule.matches) {
       const matchKey =
         `${scheduledMatch.matchNumber}:${scheduledMatch.matchType}`;

       const matchId = matchIdByKey.get(matchKey);

       if (!matchId) {
         throw new Error(
           `Could not find imported match ${matchKey}`,
         );
       }

       for (const slot of scheduledMatch.slots) {
         teamMatchRows.push({
           eventId,
           matchId,
           teamNumber: slot.teamNumber,
           alliance: slot.alliance,
           position: slot.position,
           surrogate: slot.surrogate ?? false,
         });
       }


     }


     const teamMatchInsertResult = teamMatchRows.length > 0
       ? await tx
         .insert(teamMatch)
         .values(teamMatchRows)
         .onConflictDoUpdate({
           target: [
             teamMatch.matchId,
             teamMatch.teamNumber,
           ],
           set: {
             alliance: sql`excluded.alliance`,
             position: sql`excluded.position`,
             surrogate: sql`excluded.surrogate`,
           },
         })
       : null;







    return {
      eventId: eventId,
      matchCount: schedule.matches.length,
      teamMatchCount: teamMatchInsertResult?.rowCount ?? 0,
    };
  });

  revalidatePath(routes.admin.event);
  revalidateTag(cacheTags.teamsList, "max");
  revalidateTag(cacheTags.eventTeams(result.eventId), "max");

   return result;

}
