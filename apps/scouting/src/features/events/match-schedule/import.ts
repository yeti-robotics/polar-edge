import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  driveTeamRanking,
  event,
  match,
  standForm,
  tbaMatchBreakdown,
  team,
  teamMatch,
  workabilityForm,
} from "@/lib/database/schema/tables";
import { routes } from "@/lib/routes";
import type { ImportResult, MatchSchedule } from "./types";

export async function importMatchSchedule(schedule: MatchSchedule): Promise<ImportResult> {
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
        throw new Error(`Event ${schedule.event.eventCode} does not exist`);
      }

      eventId = existingEvent.id;
    }

    const teamNamesByNumber = new Map<number, string>();

    for (const scheduledMatch of schedule.matches) {
      for (const slot of scheduledMatch.slots) {
        const knownName = slot.teamName?.trim();
        if (knownName) {
          teamNamesByNumber.set(Number(slot.teamNumber), knownName);
        } else if (!teamNamesByNumber.has(slot.teamNumber)) {
          teamNamesByNumber.set(slot.teamNumber, "");
        }
      }
    }

    const teamValues = [...teamNamesByNumber].map(([teamNumber, teamName]) => ({
      teamNumber,
      teamName,
    }));

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
                    `,
          },
        });
    }

    if (schedule.matches.length > 0) {
      await tx
        .insert(match)
        .values(
          schedule.matches.map((scheduledMatch) => ({
            eventId,
            matchType: scheduledMatch.matchType,
            matchNumber: scheduledMatch.matchNumber,
            redScore: scheduledMatch.redScore ?? null,
            blueScore: scheduledMatch.blueScore ?? null,
          }))
        )
        .onConflictDoUpdate({
          target: [match.eventId, match.matchNumber, match.matchType],
          set: {
            redScore: sql`
                 coalesce(excluded.red_score, ${match.redScore})
                 `,
            blueScore: sql`
                 coalesce(excluded.blue_score, ${match.blueScore})
                 `,
          },
        });
    }

    const incomingMatchKeys = new Set(
      schedule.matches.map(({ matchNumber, matchType }) => `${matchNumber}:${matchType}`)
    );
    const importedMatchTypes = [...new Set(schedule.matches.map(({ matchType }) => matchType))];

    const storedMatches =
      importedMatchTypes.length > 0
        ? await tx
            .select({
              id: match.id,
              matchNumber: match.matchNumber,
              matchType: match.matchType,
            })
            .from(match)
            .where(and(eq(match.eventId, eventId), inArray(match.matchType, importedMatchTypes)))
        : [];

    const staleMatches = storedMatches.filter(
      ({ matchNumber, matchType }) => !incomingMatchKeys.has(`${matchNumber}:${matchType}`)
    );
    const staleMatchIds = new Set(staleMatches.map(({ id }) => id));
    const wantedTeamsByMatch = new Map(
      schedule.matches.map(({ matchNumber, matchType, slots }) => [
        `${matchNumber}:${matchType}`,
        new Set(slots.map(({ teamNumber }) => teamNumber)),
      ])
    );

    const storedTeamMatches =
      storedMatches.length > 0
        ? await tx
            .select({
              id: teamMatch.id,
              matchId: teamMatch.matchId,
              teamNumber: teamMatch.teamNumber,
            })
            .from(teamMatch)
            .where(
              inArray(
                teamMatch.matchId,
                storedMatches.map(({ id }) => id)
              )
            )
        : [];
    const matchKeyById = new Map(
      storedMatches.map(({ id, matchNumber, matchType }) => [id, `${matchNumber}:${matchType}`])
    );
    const obsoleteTeamMatches = storedTeamMatches.filter(({ matchId, teamNumber }) => {
      if (staleMatchIds.has(matchId)) return true;
      const key = matchKeyById.get(matchId);
      return !key || !wantedTeamsByMatch.get(key)?.has(teamNumber);
    });
    const obsoleteTeamMatchIds = obsoleteTeamMatches.map(({ id }) => id);

    const protectedMatchIds = new Set<string>();

    if (obsoleteTeamMatchIds.length > 0) {
      const standForms = await tx
        .select({ teamMatchId: standForm.teamMatchId })
        .from(standForm)
        .where(inArray(standForm.teamMatchId, obsoleteTeamMatchIds));
      const breakdowns = await tx
        .select({ teamMatchId: tbaMatchBreakdown.teamMatchId })
        .from(tbaMatchBreakdown)
        .where(inArray(tbaMatchBreakdown.teamMatchId, obsoleteTeamMatchIds));
      const matchIdByTeamMatchId = new Map(
        obsoleteTeamMatches.map(({ id, matchId }) => [id, matchId])
      );

      for (const { teamMatchId } of [...standForms, ...breakdowns]) {
        const matchId = matchIdByTeamMatchId.get(teamMatchId);
        if (matchId) protectedMatchIds.add(matchId);
      }
    }

    const changedMatchIds = [
      ...new Set([
        ...staleMatches.map(({ id }) => id),
        ...obsoleteTeamMatches.map(({ matchId }) => matchId),
      ]),
    ];

    if (changedMatchIds.length > 0) {
      const obsoleteAssignments = new Set(
        obsoleteTeamMatches.map(({ matchId, teamNumber }) => `${matchId}:${teamNumber}`)
      );
      const workabilityForms = await tx
        .select({ matchId: workabilityForm.matchId, teamNumber: workabilityForm.teamNumber })
        .from(workabilityForm)
        .where(inArray(workabilityForm.matchId, changedMatchIds));
      const driveRankings = await tx
        .select({ matchId: driveTeamRanking.matchId })
        .from(driveTeamRanking)
        .where(inArray(driveTeamRanking.matchId, changedMatchIds));

      for (const { matchId, teamNumber } of workabilityForms) {
        if (
          matchId &&
          (staleMatchIds.has(matchId) || obsoleteAssignments.has(`${matchId}:${teamNumber}`))
        ) {
          protectedMatchIds.add(matchId);
        }
      }
      for (const { matchId } of driveRankings) {
        protectedMatchIds.add(matchId);
      }
    }

    if (protectedMatchIds.size > 0) {
      const protectedMatches = storedMatches
        .filter(({ id }) => protectedMatchIds.has(id))
        .map(({ matchNumber, matchType }) => `${matchType}${matchNumber}`)
        .sort();
      throw new Error(
        `Cannot replace the schedule because saved data exists for ${protectedMatches.join(", ")}. Review that data before importing again.`
      );
    }

    if (obsoleteTeamMatchIds.length > 0) {
      await tx.delete(teamMatch).where(inArray(teamMatch.id, obsoleteTeamMatchIds));
    }

    if (staleMatches.length > 0) {
      await tx.delete(match).where(
        inArray(
          match.id,
          staleMatches.map(({ id }) => id)
        )
      );
    }

    const matchIdByKey = new Map(
      storedMatches.map((storedMatch) => [
        `${storedMatch.matchNumber}:${storedMatch.matchType}`,
        storedMatch.id,
      ])
    );

    type TeamMatchValue = {
      eventId: string;
      matchId: string;
      teamNumber: number;
      alliance: "red" | "blue";
      position: 1 | 2 | 3;
      surrogate: boolean;
    };

    const teamMatchRows: TeamMatchValue[] = [];

    for (const scheduledMatch of schedule.matches) {
      const matchKey = `${scheduledMatch.matchNumber}:${scheduledMatch.matchType}`;

      const matchId = matchIdByKey.get(matchKey);

      if (!matchId) {
        throw new Error(`Could not find imported match ${matchKey}`);
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

    const teamMatchInsertResult =
      teamMatchRows.length > 0
        ? await tx
            .insert(teamMatch)
            .values(teamMatchRows)
            .onConflictDoUpdate({
              target: [teamMatch.matchId, teamMatch.teamNumber],
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
