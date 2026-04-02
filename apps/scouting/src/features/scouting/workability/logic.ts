"use server";

import { db } from "@/lib/database";
import { workabilityForm } from "@/lib/database/schema";
import type { WorkabilityRole } from "./types";

interface UpsertWorkabilityFormInput {
  eventId: string;
  teamNumber: number;
  scoutMemberId: string;
  role: WorkabilityRole;
  rating: number;
  notes: string;
}

export async function upsertWorkabilityForm(input: UpsertWorkabilityFormInput) {
  const [submission] = await db
    .insert(workabilityForm)
    .values({
      eventId: input.eventId,
      teamNumber: input.teamNumber,
      scoutMemberId: input.scoutMemberId,
      role: input.role,
      rating: input.rating,
      notes: input.notes.trim(),
    })
    .onConflictDoUpdate({
      target: [
        workabilityForm.eventId,
        workabilityForm.teamNumber,
        workabilityForm.scoutMemberId,
        workabilityForm.role,
      ],
      set: {
        rating: input.rating,
        notes: input.notes.trim(),
        updatedAt: new Date(),
      },
    })
    .returning({
      id: workabilityForm.id,
      teamNumber: workabilityForm.teamNumber,
      role: workabilityForm.role,
      rating: workabilityForm.rating,
      notes: workabilityForm.notes,
      updatedAt: workabilityForm.updatedAt,
    });

  return submission;
}
