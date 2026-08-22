import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  driveTeamRanking,
  match,
  standForm,
  tbaMatchBreakdown,
  team,
  teamMatch,
  workabilityForm,
} from "@/lib/database/schema/tables";
import { routes } from "@/lib/routes";
import {
  type ImportResult,
  type MatchSchedule,
  planScheduleChanges,
  type ScheduleChanges,
  type StoredMatch,
  type StoredSchedule,
} from "./types";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type TeamMatchValue = {
  eventId: string;
  matchId: string;
  teamNumber: number;
  alliance: "red" | "blue";
  position: 1 | 2 | 3;
  surrogate?: boolean;
};

export async function importMatchSchedule(
  eventId: string,
  schedule: MatchSchedule,
  transaction?: Transaction
): Promise<ImportResult> {
  if (schedule.matches.length === 0) {
    return { eventId, matchCount: 0, teamMatchCount: 0 };
  }

  const importSchedule = async (tx: Transaction) => {
    await upsertTeams(tx, schedule);
    await upsertMatches(tx, eventId, schedule);
    const stored = await readStoredSchedule(tx, eventId, schedule);
    const changes = planScheduleChanges(stored, schedule.matches);
    await ensureChangesAreSafe(tx, stored.matches, changes);
    await applyDeletions(tx, changes);
    return upsertAssignments(tx, eventId, stored.matches, schedule);
  };
  const result = transaction
    ? await importSchedule(transaction)
    : await db.transaction(importSchedule);

  revalidateImportedSchedule(result.eventId);
  return result;
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
  if (changes.changedMatchIds.length === 0) return protectedIds;

  const obsoleteAssignments = new Set(
    obsoleteTeamMatches.map(({ matchId, teamNumber }) => `${matchId}:${teamNumber}`)
  );
  const [workabilityForms, driveRankings] = await Promise.all([
    tx
      .select({ matchId: workabilityForm.matchId, teamNumber: workabilityForm.teamNumber })
      .from(workabilityForm)
      .where(inArray(workabilityForm.matchId, changes.changedMatchIds)),
    tx
      .select({ matchId: driveTeamRanking.matchId })
      .from(driveTeamRanking)
      .where(inArray(driveTeamRanking.matchId, changes.changedMatchIds)),
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
  const knownSurrogateRows: TeamMatchValue[] = [];
  const unknownSurrogateRows: TeamMatchValue[] = [];

  for (const scheduledMatch of schedule.matches) {
    const key = matchKey(scheduledMatch.matchNumber, scheduledMatch.matchType);
    const matchId = idByKey.get(key);
    if (!matchId) throw new Error(`Could not find imported match ${key}`);

    for (const slot of scheduledMatch.slots) {
      const row: TeamMatchValue = {
        eventId,
        matchId,
        teamNumber: slot.teamNumber,
        alliance: slot.alliance,
        position: slot.position,
      };

      if (slot.surrogate === undefined) unknownSurrogateRows.push(row);
      else knownSurrogateRows.push({ ...row, surrogate: slot.surrogate });
    }
  }

  if (knownSurrogateRows.length > 0) {
    await tx
      .insert(teamMatch)
      .values(knownSurrogateRows)
      .onConflictDoUpdate({
        target: [teamMatch.matchId, teamMatch.teamNumber],
        set: {
          alliance: sql`excluded.alliance`,
          position: sql`excluded.position`,
          surrogate: sql`excluded.surrogate`,
        },
      });
  }

  if (unknownSurrogateRows.length > 0) {
    await tx
      .insert(teamMatch)
      .values(unknownSurrogateRows)
      .onConflictDoUpdate({
        target: [teamMatch.matchId, teamMatch.teamNumber],
        set: {
          alliance: sql`excluded.alliance`,
          position: sql`excluded.position`,
        },
      });
  }

  return {
    eventId,
    matchCount: schedule.matches.length,
    teamMatchCount: knownSurrogateRows.length + unknownSurrogateRows.length,
  };
}

function matchKey(matchNumber: number, matchType: string): string {
  return `${matchNumber}:${matchType}`;
}

function revalidateImportedSchedule(eventId: string): void {
  revalidatePath(routes.admin.event);
  revalidateTag(cacheTags.teamsList, "max");
  revalidateTag(cacheTags.eventTeams(eventId), "max");
  revalidateTag(cacheTags.matchScores(eventId), "max");
  revalidateTag(cacheTags.teamMetrics(eventId), "max");
}
