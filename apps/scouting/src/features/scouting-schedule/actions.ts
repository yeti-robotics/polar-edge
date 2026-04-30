"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  match,
  member,
  organizationEvent,
  scoutingSchedule,
  scoutingScheduleAssignment,
  teamMatch,
} from "@/lib/database/schema";
import { requireAdminMember } from "@/lib/server/auth/require-member";
import { buildDefaultScheduleInfoSections, buildDefaultShiftSections } from "./logic";
import {
  CreateScoutingScheduleSchema,
  UpdateScoutingScheduleAssignmentSchema,
  UpdateScoutingScheduleDetailsSchema,
} from "./types";

export type CreateScoutingScheduleState = {
  data: { success: true; scheduleId: string } | null;
  error: string | null;
};

const initialCreateState: CreateScoutingScheduleState = {
  data: null,
  error: null,
};

export async function createScoutingScheduleAction(
  _prevState: CreateScoutingScheduleState = initialCreateState,
  formData: FormData
): Promise<CreateScoutingScheduleState> {
  try {
    const activeMember = await requireAdminMember();
    const validated = CreateScoutingScheduleSchema.safeParse({
      eventId: formData.get("eventId"),
      name: formData.get("name"),
    });

    if (!validated.success) {
      return { data: null, error: "Please provide an event and schedule name." };
    }

    const organizationEventRecord = await db.query.organizationEvent.findFirst({
      where: and(
        eq(organizationEvent.organizationId, activeMember.organizationId),
        eq(organizationEvent.eventId, validated.data.eventId)
      ),
      with: {
        event: true,
      },
    });

    if (!organizationEventRecord?.event) {
      return { data: null, error: "Choose an event that belongs to your organization." };
    }

    const eventMatches = await db
      .select({ matchNumber: match.matchNumber })
      .from(match)
      .where(and(eq(match.eventId, validated.data.eventId), eq(match.matchType, "qm")))
      .orderBy(match.matchNumber);

    const [newSchedule] = await db
      .insert(scoutingSchedule)
      .values({
        organizationId: activeMember.organizationId,
        eventId: validated.data.eventId,
        name: validated.data.name,
        infoSections: buildDefaultScheduleInfoSections(
          organizationEventRecord.event.startDate,
          organizationEventRecord.event.endDate
        ),
        shiftSections: buildDefaultShiftSections(eventMatches.map((entry) => entry.matchNumber)),
        createdByMemberId: activeMember.id,
      })
      .returning({ id: scoutingSchedule.id });

    if (!newSchedule) {
      return { data: null, error: "Failed to create scouting schedule." };
    }

    revalidateTag(cacheTags.scoutingSchedules(activeMember.organizationId), "max");
    revalidateTag(cacheTags.scoutingSchedule(activeMember.organizationId, newSchedule.id), "max");

    return { data: { success: true, scheduleId: newSchedule.id }, error: null };
  } catch (error) {
    console.error("Create scouting schedule error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create scouting schedule.",
    };
  }
}

export async function updateScoutingScheduleDetails(input: unknown) {
  try {
    const activeMember = await requireAdminMember();
    const validated = UpdateScoutingScheduleDetailsSchema.safeParse(input);

    if (!validated.success) {
      return { data: null, error: "The schedule details are invalid." };
    }

    const scheduleRecord = await db.query.scoutingSchedule.findFirst({
      where: and(
        eq(scoutingSchedule.id, validated.data.scheduleId),
        eq(scoutingSchedule.organizationId, activeMember.organizationId)
      ),
      columns: {
        id: true,
        eventId: true,
      },
    });

    if (!scheduleRecord) {
      return { data: null, error: "Scouting schedule not found." };
    }

    const coordinatorIds = [
      ...new Set(
        validated.data.shiftSections
          .map((shift) => shift.coordinatorMemberId)
          .filter((memberId): memberId is string => !!memberId)
      ),
    ];

    if (coordinatorIds.length > 0) {
      const matchingMembers = await db
        .select({ id: member.id })
        .from(member)
        .where(
          and(
            eq(member.organizationId, activeMember.organizationId),
            inArray(member.id, coordinatorIds)
          )
        );

      if (matchingMembers.length !== coordinatorIds.length) {
        return {
          data: null,
          error: "One or more shift coordinators are no longer in the organization.",
        };
      }
    }

    const eventMatches = await db
      .select({ matchNumber: match.matchNumber })
      .from(match)
      .where(and(eq(match.eventId, scheduleRecord.eventId), eq(match.matchType, "qm")))
      .orderBy(match.matchNumber);

    if (eventMatches.length > 0) {
      const minMatch = eventMatches[0]?.matchNumber ?? 1;
      const maxMatch = eventMatches[eventMatches.length - 1]?.matchNumber ?? minMatch;
      const hasOutOfBoundsShift = validated.data.shiftSections.some(
        (shift) => shift.startMatch < minMatch || shift.endMatch > maxMatch
      );

      if (hasOutOfBoundsShift) {
        return {
          data: null,
          error: `Shift ranges must stay within qualification matches ${minMatch}-${maxMatch}.`,
        };
      }
    }

    await db
      .update(scoutingSchedule)
      .set({
        name: validated.data.name,
        isOpen: validated.data.isOpen,
        infoSections: validated.data.infoSections,
        shiftSections: validated.data.shiftSections,
      })
      .where(eq(scoutingSchedule.id, validated.data.scheduleId));

    revalidateTag(cacheTags.scoutingSchedules(activeMember.organizationId), "max");
    revalidateTag(
      cacheTags.scoutingSchedule(activeMember.organizationId, validated.data.scheduleId),
      "max"
    );

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Update scouting schedule details error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to save scouting schedule details.",
    };
  }
}

export async function updateScoutingScheduleAssignment(input: unknown) {
  try {
    const activeMember = await requireAdminMember();
    const validated = UpdateScoutingScheduleAssignmentSchema.safeParse(input);

    if (!validated.success) {
      return { data: null, error: "The assignment request is invalid." };
    }

    const scheduleRecord = await db.query.scoutingSchedule.findFirst({
      where: and(
        eq(scoutingSchedule.id, validated.data.scheduleId),
        eq(scoutingSchedule.organizationId, activeMember.organizationId)
      ),
      columns: {
        id: true,
        eventId: true,
      },
    });

    if (!scheduleRecord) {
      return { data: null, error: "Scouting schedule not found." };
    }

    const [teamMatchRecord] = await db
      .select({
        id: teamMatch.id,
      })
      .from(teamMatch)
      .innerJoin(match, eq(match.id, teamMatch.matchId))
      .where(
        and(
          eq(teamMatch.id, validated.data.teamMatchId),
          eq(teamMatch.eventId, scheduleRecord.eventId),
          eq(match.matchType, "qm")
        )
      )
      .limit(1);

    if (!teamMatchRecord) {
      return { data: null, error: "That team slot is not part of this schedule's event." };
    }

    if (validated.data.memberId) {
      const memberRecord = await db.query.member.findFirst({
        where: and(
          eq(member.id, validated.data.memberId),
          eq(member.organizationId, activeMember.organizationId)
        ),
        columns: { id: true },
      });

      if (!memberRecord) {
        return { data: null, error: "That member is no longer active in your organization." };
      }
    }

    await db.transaction(async (tx) => {
      if (!validated.data.memberId) {
        await tx
          .delete(scoutingScheduleAssignment)
          .where(
            and(
              eq(scoutingScheduleAssignment.scheduleId, validated.data.scheduleId),
              eq(scoutingScheduleAssignment.teamMatchId, validated.data.teamMatchId),
              eq(scoutingScheduleAssignment.slotIndex, validated.data.slotIndex)
            )
          );
        return;
      }

      await tx
        .delete(scoutingScheduleAssignment)
        .where(
          and(
            eq(scoutingScheduleAssignment.scheduleId, validated.data.scheduleId),
            eq(scoutingScheduleAssignment.teamMatchId, validated.data.teamMatchId),
            eq(scoutingScheduleAssignment.memberId, validated.data.memberId)
          )
        );

      await tx
        .insert(scoutingScheduleAssignment)
        .values({
          scheduleId: validated.data.scheduleId,
          teamMatchId: validated.data.teamMatchId,
          slotIndex: validated.data.slotIndex,
          memberId: validated.data.memberId,
        })
        .onConflictDoUpdate({
          target: [
            scoutingScheduleAssignment.scheduleId,
            scoutingScheduleAssignment.teamMatchId,
            scoutingScheduleAssignment.slotIndex,
          ],
          set: {
            memberId: validated.data.memberId,
            updatedAt: sql`now()`,
          },
        });
    });

    revalidateTag(
      cacheTags.scoutingSchedule(activeMember.organizationId, validated.data.scheduleId),
      "max"
    );

    return {
      data: {
        success: true,
        teamMatchId: validated.data.teamMatchId,
        slotIndex: validated.data.slotIndex,
        memberId: validated.data.memberId,
      },
      error: null,
    };
  } catch (error) {
    console.error("Update scouting schedule assignment error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update assignment.",
    };
  }
}
