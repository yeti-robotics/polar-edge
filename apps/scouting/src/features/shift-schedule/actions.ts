"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { member, shiftSchedule } from "@/lib/database/schema";
import { routes } from "@/lib/routes";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import {
  normalizeShiftScheduleEntries,
  type ShiftScheduleEntry,
  ShiftSchedulePayloadSchema,
} from "./types";

export type UpdateShiftScheduleState = {
  data: { success: true } | null;
  error: string | null;
};

function isStandEntryValid(entry: ShiftScheduleEntry) {
  return (
    entry.standStation && entry.matchStart && entry.matchEnd && entry.matchStart <= entry.matchEnd
  );
}

export async function updateShiftScheduleAction(
  payload: unknown
): Promise<UpdateShiftScheduleState> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { data: null, error: "Unauthorized" };
    }

    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (!activeMember) {
      return { data: null, error: "No active organization" };
    }

    if (activeMember.role !== "admin" && activeMember.role !== "owner") {
      return { data: null, error: "Only admins can update the scouting schedule" };
    }

    const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);
    if (!activeEvent?.event) {
      return { data: null, error: "Set an active event before publishing a schedule" };
    }

    const parsed = ShiftSchedulePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return { data: null, error: "Invalid schedule payload" };
    }

    const entries = normalizeShiftScheduleEntries(parsed.data.entries).map((entry) => ({
      ...entry,
      memberId: entry.memberId ?? null,
      email: entry.email?.trim() || null,
      name: entry.name.trim(),
      notes: entry.notes?.trim() || null,
    }));

    if (entries.some((entry) => !entry.memberId || !entry.name)) {
      return { data: null, error: "Each schedule assignment needs an assignee" };
    }

    if (
      entries.some((entry) =>
        entry.assignmentType === "stand" ? !isStandEntryValid(entry) : !!entry.standStation
      )
    ) {
      return {
        data: null,
        error: "Stand assignments need a slot and match range, and pit assignments should not.",
      };
    }

    const memberIds = [
      ...new Set(entries.map((entry) => entry.memberId).filter(Boolean)),
    ] as string[];
    const membersInOrganization =
      memberIds.length === 0
        ? []
        : await db
            .select({ id: member.id, organizationId: member.organizationId })
            .from(member)
            .where(inArray(member.id, memberIds));

    if (
      membersInOrganization.length !== memberIds.length ||
      membersInOrganization.some((entry) => entry.organizationId !== activeMember.organizationId)
    ) {
      return { data: null, error: "Assignments must use members from your organization" };
    }

    await db
      .insert(shiftSchedule)
      .values({
        organizationId: activeMember.organizationId,
        eventId: activeEvent.event.id,
        scheduleData: { entries },
      })
      .onConflictDoUpdate({
        target: [shiftSchedule.organizationId, shiftSchedule.eventId],
        set: {
          scheduleData: { entries },
          updatedAt: new Date(),
        },
      });

    revalidatePath(routes.scoutingschedule.root);
    revalidatePath(routes.admin.root);

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Update shift schedule error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to save the scouting schedule",
    };
  }
}
