"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { member } from "@/lib/database/schema/tables/member";
import { shiftSchedule } from "@/lib/database/schema/tables/shift-schedule";
import { routes } from "@/lib/routes";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { normalizeShiftScheduleEntries, ShiftSchedulePayloadSchema } from "./types";

export type UpdateShiftScheduleState = {
  data: { success: true } | null;
  error: string | null;
};

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
      return { data: null, error: "Set an active event before publishing a scouting schedule" };
    }

    const parsed = ShiftSchedulePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return { data: null, error: "Invalid schedule payload" };
    }

    const entries = normalizeShiftScheduleEntries(parsed.data.entries).map((entry) => ({
      ...entry,
      memberId: entry.memberId ?? null,
      email: entry.email ?? null,
      notes: entry.notes?.trim() || null,
      name: entry.name.trim(),
      role: entry.role.trim(),
      shift: entry.shift.trim(),
    }));

    if (entries.some((entry) => !entry.memberId || !entry.name || !entry.role || !entry.shift)) {
      return { data: null, error: "Each assignment needs an assignee, role, and shift" };
    }

    const memberIds = [
      ...new Set(
        entries
          .map((entry) => entry.memberId)
          .filter((value): value is string => value !== null)
      ),
    ];
    const membersInOrganization = await db.query.member.findMany({
      where: inArray(member.id, memberIds),
      columns: {
        id: true,
        organizationId: true,
      },
    });

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
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "";
        const causeMessage =
          error && typeof error === "object" && "cause" in error && error.cause instanceof Error
            ? error.cause.message
            : "";

        if (
          message.includes('relation "shift_schedule" does not exist') ||
          causeMessage.includes('relation "shift_schedule" does not exist')
        ) {
          throw new Error("Shift schedule storage is missing. Run the scouting database migrations.");
        }

        throw error;
      });

    revalidatePath(routes.schedule.root);
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
