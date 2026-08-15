import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/database";
import { match, teamMatch, workabilityForm } from "@/lib/database/schema";
import type { WorkabilityRole } from "./types";

interface UpsertWorkabilityFormInput {
  eventId: string;
  matchId: string;
  teamNumber: number;
  scoutMemberId: string;
  role: WorkabilityRole;
  rating: number;
  notes: string;
}

export async function getWorkabilityMatchSelection(
  eventId: string,
  matchNumber: number,
  teamNumber: number
) {
  const [selection] = await db
    .select({
      matchId: match.id,
      matchNumber: match.matchNumber,
      teamNumber: teamMatch.teamNumber,
    })
    .from(match)
    .innerJoin(teamMatch, eq(teamMatch.matchId, match.id))
    .where(
      and(
        eq(match.eventId, eventId),
        eq(match.matchNumber, matchNumber),
        eq(teamMatch.teamNumber, teamNumber)
      )
    )
    .limit(1);

  return selection ?? null;
}

export async function upsertWorkabilityForm(input: UpsertWorkabilityFormInput) {
  const [submission] = await db
    .insert(workabilityForm)
    .values({
      eventId: input.eventId,
      matchId: input.matchId,
      teamNumber: input.teamNumber,
      scoutMemberId: input.scoutMemberId,
      role: input.role,
      rating: input.rating,
      notes: input.notes.trim(),
    })
    .onConflictDoUpdate({
      target: [
        workabilityForm.matchId,
        workabilityForm.teamNumber,
        workabilityForm.scoutMemberId,
        workabilityForm.role,
      ],
      set: {
        matchId: input.matchId,
        rating: input.rating,
        notes: input.notes.trim(),
        updatedAt: new Date(),
      },
    })
    .returning({
      id: workabilityForm.id,
      matchId: workabilityForm.matchId,
      teamNumber: workabilityForm.teamNumber,
      role: workabilityForm.role,
      rating: workabilityForm.rating,
      notes: workabilityForm.notes,
      updatedAt: workabilityForm.updatedAt,
    });

  return submission;
}
