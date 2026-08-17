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

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type StoredMatch = Pick<typeof match.$inferSelect, "id" | "matchNumber" | "matchType">;
type StoredTeamMatch = Pick<typeof teamMatch.$inferSelect, "id" | "matchId" | "teamNumber">;

type StoredSchedule = {
  matches: StoredMatch[];
  teamMatches: StoredTeamMatch[];
};

type ScheduleChanges = {
  staleMatches: StoredMatch[];
  obsoleteTeamMatches: StoredTeamMatch[];
};

type TeamMatchValue = {
  eventId: string;
  matchId: string;
  teamNumber: number;
  alliance: "red" | "blue";
  position: 1 | 2 | 3;
  surrogate: boolean;
};

export async function importMatchSchedule(schedule: MatchSchedule): Promise<ImportResult> {
  const result = await db.transaction(async (tx) => {
    const eventId = await resolveEvent(tx, schedule);
    await upsertTeams(tx, schedule);
    await upsertMatches(tx, eventId, schedule);
    const stored = await readStoredSchedule(tx, eventId, schedule);
    const changes = planScheduleChanges(stored, schedule);
    await ensureChangesAreSafe(tx, stored.matches, changes);
    await applyDeletions(tx, changes);
    return upsertAssignments(tx, eventId, stored.matches, schedule);
  });

  revalidateImportedSchedule(result.eventId);
  return result;
}

async function resolveEvent(tx: Transaction, schedule: MatchSchedule): Promise<string> {
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
      .returning({ id: event.id });

    if (!upsertedEvent) throw new Error("Failed to create or update event");
    return upsertedEvent.id;
  }

  const [existingEvent] = await tx
    .select({ id: event.id })
    .from(event)
    .where(eq(event.eventCode, schedule.event.eventCode))
    .limit(1);

  if (!existingEvent) throw new Error(`Event ${schedule.event.eventCode} does not exist`);
  return existingEvent.id;
}

async function upsertTeams(tx: Transaction, schedule: MatchSchedule): Promise<void> {
  const namesByNumber = new Map<number, string>();

  for (const scheduledMatch of schedule.matches) {
    for (const slot of scheduledMatch.slots) {
      const knownName = slot.teamName?.trim();
      if (knownName) namesByNumber.set(slot.teamNumber, knownName);
      else if (!namesByNumber.has(slot.teamNumber)) namesByNumber.set(slot.teamNumber, "");
    }
  }

  const values = [...namesByNumber].map(([teamNumber, teamName]) => ({ teamNumber, teamName }));
  if (values.length === 0) return;

  await tx
    .insert(team)
    .values(values)
    .onConflictDoUpdate({
      target: team.teamNumber,
      set: {
        teamName: sql`case
          when excluded.team_name <> '' then excluded.team_name
          else ${team.teamName}
        end`,
      },
    });
}

async function upsertMatches(
  tx: Transaction,
  eventId: string,
  schedule: MatchSchedule
): Promise<void> {
  if (schedule.matches.length === 0) return;

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
        redScore: sql`coalesce(excluded.red_score, ${match.redScore})`,
        blueScore: sql`coalesce(excluded.blue_score, ${match.blueScore})`,
      },
    });
}

async function readStoredSchedule(
  tx: Transaction,
  eventId: string,
  schedule: MatchSchedule
): Promise<StoredSchedule> {
  const importedMatchTypes = [...new Set(schedule.matches.map(({ matchType }) => matchType))];
  if (importedMatchTypes.length === 0) return { matches: [], teamMatches: [] };

  const matches = await tx
    .select({ id: match.id, matchNumber: match.matchNumber, matchType: match.matchType })
    .from(match)
    .where(and(eq(match.eventId, eventId), inArray(match.matchType, importedMatchTypes)));

  const teamMatches =
    matches.length === 0
      ? []
      : await tx
          .select({
            id: teamMatch.id,
            matchId: teamMatch.matchId,
            teamNumber: teamMatch.teamNumber,
          })
          .from(teamMatch)
          .where(
            inArray(
              teamMatch.matchId,
              matches.map(({ id }) => id)
            )
          );

  return { matches, teamMatches };
}

function planScheduleChanges(stored: StoredSchedule, schedule: MatchSchedule): ScheduleChanges {
  const incomingKeys = new Set(
    schedule.matches.map(({ matchNumber, matchType }) => matchKey(matchNumber, matchType))
  );
  const staleMatches = stored.matches.filter(
    ({ matchNumber, matchType }) => !incomingKeys.has(matchKey(matchNumber, matchType))
  );
  const staleMatchIds = new Set(staleMatches.map(({ id }) => id));
  const storedKeyById = new Map(
    stored.matches.map(({ id, matchNumber, matchType }) => [id, matchKey(matchNumber, matchType)])
  );
  const wantedTeamsByMatch = new Map(
    schedule.matches.map(({ matchNumber, matchType, slots }) => [
      matchKey(matchNumber, matchType),
      new Set(slots.map(({ teamNumber }) => teamNumber)),
    ])
  );
  const obsoleteTeamMatches = stored.teamMatches.filter(({ matchId, teamNumber }) => {
    if (staleMatchIds.has(matchId)) return true;
    const key = storedKeyById.get(matchId);
    return !key || !wantedTeamsByMatch.get(key)?.has(teamNumber);
  });

  return { staleMatches, obsoleteTeamMatches };
}

async function ensureChangesAreSafe(
  tx: Transaction,
  storedMatches: StoredMatch[],
  changes: ScheduleChanges
): Promise<void> {
  const protectedMatchIds = await findProtectedMatches(tx, changes);
  if (protectedMatchIds.size === 0) return;

  const descriptions = storedMatches
    .filter(({ id }) => protectedMatchIds.has(id))
    .map(({ matchNumber, matchType }) => `${matchType}${matchNumber}`)
    .sort();
  throw new Error(
    `Cannot replace the schedule because saved data exists for ${descriptions.join(", ")}. Review that data before importing again.`
  );
}

async function findProtectedMatches(
  tx: Transaction,
  changes: ScheduleChanges
): Promise<Set<string>> {
  const { staleMatches, obsoleteTeamMatches } = changes;
  const obsoleteIds = obsoleteTeamMatches.map(({ id }) => id);
  const protectedIds = new Set<string>();

  if (obsoleteIds.length > 0) {
    const [standForms, breakdowns] = await Promise.all([
      tx
        .select({ teamMatchId: standForm.teamMatchId })
        .from(standForm)
        .where(inArray(standForm.teamMatchId, obsoleteIds)),
      tx
        .select({ teamMatchId: tbaMatchBreakdown.teamMatchId })
        .from(tbaMatchBreakdown)
        .where(inArray(tbaMatchBreakdown.teamMatchId, obsoleteIds)),
    ]);
    const matchIdByAssignmentId = new Map(
      obsoleteTeamMatches.map(({ id, matchId }) => [id, matchId])
    );

    for (const { teamMatchId } of [...standForms, ...breakdowns]) {
      const matchId = matchIdByAssignmentId.get(teamMatchId);
      if (matchId) protectedIds.add(matchId);
    }
  }

  const staleIds = new Set(staleMatches.map(({ id }) => id));
  const changedIds = [
    ...new Set([...staleIds, ...obsoleteTeamMatches.map(({ matchId }) => matchId)]),
  ];
  if (changedIds.length === 0) return protectedIds;

  const obsoleteAssignments = new Set(
    obsoleteTeamMatches.map(({ matchId, teamNumber }) => `${matchId}:${teamNumber}`)
  );
  const [workabilityForms, driveRankings] = await Promise.all([
    tx
      .select({ matchId: workabilityForm.matchId, teamNumber: workabilityForm.teamNumber })
      .from(workabilityForm)
      .where(inArray(workabilityForm.matchId, changedIds)),
    tx
      .select({ matchId: driveTeamRanking.matchId })
      .from(driveTeamRanking)
      .where(inArray(driveTeamRanking.matchId, changedIds)),
  ]);

  for (const { matchId, teamNumber } of workabilityForms) {
    if (matchId && (staleIds.has(matchId) || obsoleteAssignments.has(`${matchId}:${teamNumber}`))) {
      protectedIds.add(matchId);
    }
  }
  for (const { matchId } of driveRankings) protectedIds.add(matchId);

  return protectedIds;
}

async function applyDeletions(tx: Transaction, changes: ScheduleChanges): Promise<void> {
  const obsoleteIds = changes.obsoleteTeamMatches.map(({ id }) => id);
  if (obsoleteIds.length > 0) await tx.delete(teamMatch).where(inArray(teamMatch.id, obsoleteIds));

  const staleIds = changes.staleMatches.map(({ id }) => id);
  if (staleIds.length > 0) await tx.delete(match).where(inArray(match.id, staleIds));
}

async function upsertAssignments(
  tx: Transaction,
  eventId: string,
  storedMatches: StoredMatch[],
  schedule: MatchSchedule
): Promise<ImportResult> {
  const idByKey = new Map(
    storedMatches.map(({ id, matchNumber, matchType }) => [matchKey(matchNumber, matchType), id])
  );
  const rows: TeamMatchValue[] = [];

  for (const scheduledMatch of schedule.matches) {
    const key = matchKey(scheduledMatch.matchNumber, scheduledMatch.matchType);
    const matchId = idByKey.get(key);
    if (!matchId) throw new Error(`Could not find imported match ${key}`);

    for (const slot of scheduledMatch.slots) {
      rows.push({
        eventId,
        matchId,
        teamNumber: slot.teamNumber,
        alliance: slot.alliance,
        position: slot.position,
        surrogate: slot.surrogate ?? false,
      });
    }
  }

  if (rows.length > 0) {
    await tx
      .insert(teamMatch)
      .values(rows)
      .onConflictDoUpdate({
        target: [teamMatch.matchId, teamMatch.teamNumber],
        set: {
          alliance: sql`excluded.alliance`,
          position: sql`excluded.position`,
          surrogate: sql`excluded.surrogate`,
        },
      });
  }

  return { eventId, matchCount: schedule.matches.length, teamMatchCount: rows.length };
}

function matchKey(matchNumber: number, matchType: string): string {
  return `${matchNumber}:${matchType}`;
}

function revalidateImportedSchedule(eventId: string): void {
  revalidatePath(routes.admin.event);
  revalidateTag(cacheTags.teamsList, "max");
  revalidateTag(cacheTags.eventTeams(eventId), "max");
}
