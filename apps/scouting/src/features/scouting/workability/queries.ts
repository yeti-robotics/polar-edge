import "server-only";

import { and, asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { match, member, team, teamMatch, user, workabilityForm } from "@/lib/database/schema";
import type {
  EditableWorkabilitySubmission,
  TeamWorkabilitySummary,
  WorkabilityMatchOption,
  WorkabilityNote,
} from "./types";

const round1 = (value: number) => Math.round(value * 10) / 10;

function getCompositeCompatibilityScore(
  avgDriverWorkability: number | null,
  avgHumanPlayerWorkability: number | null
) {
  const ratings = [avgDriverWorkability, avgHumanPlayerWorkability].filter(
    (value): value is number => value !== null
  );

  if (ratings.length === 0) {
    return null;
  }

  return round1(ratings.reduce((sum, value) => sum + value, 0) / ratings.length);
}

export async function getEventWorkabilityMatchOptions(eventId: string) {
  "use cache";
  cacheLife("minutes");

  const rows = await db
    .select({
      matchNumber: match.matchNumber,
      teamNumber: teamMatch.teamNumber,
      teamName: team.teamName,
      alliance: teamMatch.alliance,
      position: teamMatch.position,
    })
    .from(teamMatch)
    .innerJoin(match, eq(teamMatch.matchId, match.id))
    .innerJoin(team, eq(team.teamNumber, teamMatch.teamNumber))
    .where(eq(teamMatch.eventId, eventId))
    .orderBy(asc(match.matchNumber), asc(teamMatch.alliance), asc(teamMatch.position));

  const matchMap = new Map<number, WorkabilityMatchOption>();

  for (const row of rows) {
    const current = matchMap.get(row.matchNumber) ?? {
      matchNumber: row.matchNumber,
      teams: [],
    };

    current.teams.push({
      teamNumber: row.teamNumber,
      teamName: row.teamName,
      alliance: row.alliance,
      position: row.position,
    });

    matchMap.set(row.matchNumber, current);
  }

  return Array.from(matchMap.values());
}

export async function getMemberWorkabilitySubmissions(eventId: string, memberId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.memberWorkability(eventId, memberId));

  const submissions = await db
    .select({
      id: workabilityForm.id,
      matchNumber: match.matchNumber,
      teamNumber: workabilityForm.teamNumber,
      role: workabilityForm.role,
      rating: workabilityForm.rating,
      notes: workabilityForm.notes,
      updatedAt: workabilityForm.updatedAt,
    })
    .from(workabilityForm)
    .innerJoin(match, eq(match.id, workabilityForm.matchId))
    .where(
      and(
        eq(workabilityForm.eventId, eventId),
        eq(workabilityForm.scoutMemberId, memberId),
        isNotNull(workabilityForm.matchId)
      )
    )
    .orderBy(desc(workabilityForm.updatedAt));

  return submissions.map<EditableWorkabilitySubmission>((submission) => ({
    id: submission.id,
    matchNumber: submission.matchNumber,
    teamNumber: submission.teamNumber,
    role: submission.role,
    rating: submission.rating,
    notes: submission.notes,
    updatedAt: submission.updatedAt.toISOString(),
  }));
}

export async function getWorkabilitySummaryForEvent(eventId: string, organizationId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.workabilityEvent(eventId, organizationId));

  const [aggregateRows, noteRows] = await Promise.all([
    db
      .select({
        teamNumber: workabilityForm.teamNumber,
        avgDriverWorkability: sql<number | null>`
          avg(case when ${workabilityForm.role} = 'driver' then ${workabilityForm.rating} end)
        `.as("avg_driver_workability"),
        avgHumanPlayerWorkability: sql<number | null>`
          avg(case when ${workabilityForm.role} = 'human_player' then ${workabilityForm.rating} end)
        `.as("avg_human_player_workability"),
        submissionCount: count(workabilityForm.id),
        noteCount: sql<number>`
          sum(case when length(trim(${workabilityForm.notes})) > 0 then 1 else 0 end)::int
        `.as("note_count"),
      })
      .from(workabilityForm)
      .innerJoin(member, eq(member.id, workabilityForm.scoutMemberId))
      .where(
        and(
          eq(workabilityForm.eventId, eventId),
          eq(member.organizationId, organizationId),
          isNotNull(workabilityForm.matchId)
        )
      )
      .groupBy(workabilityForm.teamNumber),
    db
      .select({
        matchNumber: match.matchNumber,
        teamNumber: workabilityForm.teamNumber,
        role: workabilityForm.role,
        note: workabilityForm.notes,
        authorName: user.name,
        updatedAt: workabilityForm.updatedAt,
      })
      .from(workabilityForm)
      .innerJoin(match, eq(match.id, workabilityForm.matchId))
      .innerJoin(member, eq(member.id, workabilityForm.scoutMemberId))
      .innerJoin(user, eq(user.id, member.userId))
      .where(
        and(
          eq(workabilityForm.eventId, eventId),
          eq(member.organizationId, organizationId),
          isNotNull(workabilityForm.matchId),
          sql`length(trim(${workabilityForm.notes})) > 0`
        )
      )
      .orderBy(desc(workabilityForm.updatedAt)),
  ]);

  const notesByTeam = new Map<number, WorkabilityNote[]>();

  for (const row of noteRows) {
    const currentNotes = notesByTeam.get(row.teamNumber) ?? [];
    if (currentNotes.length >= 6) {
      continue;
    }

    currentNotes.push({
      matchNumber: row.matchNumber,
      role: row.role,
      note: row.note,
      authorName: row.authorName ?? null,
      updatedAt: row.updatedAt.toISOString(),
    });
    notesByTeam.set(row.teamNumber, currentNotes);
  }

  return new Map<number, TeamWorkabilitySummary>(
    aggregateRows.map((row) => {
      const avgDriverWorkability =
        row.avgDriverWorkability === null ? null : round1(Number(row.avgDriverWorkability));
      const avgHumanPlayerWorkability =
        row.avgHumanPlayerWorkability === null
          ? null
          : round1(Number(row.avgHumanPlayerWorkability));

      return [
        row.teamNumber,
        {
          teamNumber: row.teamNumber,
          avgDriverWorkability,
          avgHumanPlayerWorkability,
          compositeCompatibilityScore: getCompositeCompatibilityScore(
            avgDriverWorkability,
            avgHumanPlayerWorkability
          ),
          submissionCount: Number(row.submissionCount) || 0,
          noteCount: Number(row.noteCount) || 0,
          notes: notesByTeam.get(row.teamNumber) ?? [],
        },
      ];
    })
  );
}
