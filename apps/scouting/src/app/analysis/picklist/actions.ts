"use server";

import { and, eq, gt, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { picklist, picklistTeam } from "@/lib/database/schema";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import {
  AddTeamToPicklistSchema,
  CreatePicklistSchema,
  DeletePicklistSchema,
  RemoveTeamFromPicklistSchema,
  ReorderPicklistTeamSchema,
  TogglePickedSchema,
} from "./types";

export type CreatePicklistState = {
  data: { success: true; picklistId: string } | null;
  error: string | null;
};

/**
 * Create a new picklist for the active event and organization
 */
export async function createPicklistAction(
  _prevState: CreatePicklistState,
  formData: FormData
): Promise<CreatePicklistState> {
  try {
    const name = formData.get("name") as string;

    // 1. Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { data: null, error: "Unauthorized" };
    }

    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (!activeMember) {
      return { data: null, error: "No active organization" };
    }

    // 2. Get active event
    const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);
    if (!activeEvent?.event) {
      return { data: null, error: "No active event" };
    }

    // 3. Validate input
    const validated = CreatePicklistSchema.safeParse({ name });
    if (!validated.success) {
      return { data: null, error: "Invalid input" };
    }

    // 4. Create picklist
    const [newPicklist] = await db
      .insert(picklist)
      .values({
        name: validated.data.name,
        organizationId: activeMember.organizationId,
        eventId: activeEvent.event.id,
        createdByMemberId: activeMember.id,
      })
      .returning({ id: picklist.id });

    if (!newPicklist) {
      return { data: null, error: "Failed to create picklist" };
    }

    revalidatePath("/analysis/picklist");
    return { data: { success: true, picklistId: newPicklist.id }, error: null };
  } catch (error) {
    console.error("Create picklist error:", error);
    return { data: null, error: "Failed to create picklist" };
  }
}

/**
 * Add a team to a picklist at the specified rank
 * Shifts existing teams down if necessary
 */
export async function addTeamToPicklist(data: unknown) {
  try {
    // 1. Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (!activeMember) {
      return { error: "No active organization" };
    }

    // 2. Validate input
    const validated = AddTeamToPicklistSchema.safeParse(data);
    if (!validated.success) {
      return { error: "Invalid input" };
    }

    // 3. Verify picklist belongs to organization
    const picklistRecord = await db.query.picklist.findFirst({
      where: and(
        eq(picklist.id, validated.data.picklistId),
        eq(picklist.organizationId, activeMember.organizationId)
      ),
    });

    if (!picklistRecord) {
      return { error: "Picklist not found" };
    }

    // 4. Transaction: shift ranks down and insert
    await db.transaction(async (tx) => {
      // Shift all teams at or below this rank down by 1
      await tx
        .update(picklistTeam)
        .set({ rank: sql`${picklistTeam.rank} + 1` })
        .where(
          and(
            eq(picklistTeam.picklistId, validated.data.picklistId),
            gte(picklistTeam.rank, validated.data.rank)
          )
        );

      // Insert the new team
      await tx.insert(picklistTeam).values({
        picklistId: validated.data.picklistId,
        teamNumber: validated.data.teamNumber,
        rank: validated.data.rank,
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Add team to picklist error:", error);
    return { error: "Failed to add team" };
  }
}

/**
 * Remove a team from a picklist
 * Closes the rank gap by shifting teams up
 */
export async function removeTeamFromPicklist(data: unknown) {
  try {
    // 1. Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (!activeMember) {
      return { error: "No active organization" };
    }

    // 2. Validate input
    const validated = RemoveTeamFromPicklistSchema.safeParse(data);
    if (!validated.success) {
      return { error: "Invalid input" };
    }

    // 3. Verify picklist belongs to organization
    const picklistRecord = await db.query.picklist.findFirst({
      where: and(
        eq(picklist.id, validated.data.picklistId),
        eq(picklist.organizationId, activeMember.organizationId)
      ),
    });

    if (!picklistRecord) {
      return { error: "Picklist not found" };
    }

    // 4. Transaction: delete team and close rank gap
    await db.transaction(async (tx) => {
      // Get the rank of the team being removed
      const [teamToRemove] = await tx
        .select({ rank: picklistTeam.rank })
        .from(picklistTeam)
        .where(
          and(
            eq(picklistTeam.picklistId, validated.data.picklistId),
            eq(picklistTeam.teamNumber, validated.data.teamNumber)
          )
        )
        .limit(1);

      if (!teamToRemove) {
        throw new Error("Team not found in picklist");
      }

      // Delete the team
      await tx
        .delete(picklistTeam)
        .where(
          and(
            eq(picklistTeam.picklistId, validated.data.picklistId),
            eq(picklistTeam.teamNumber, validated.data.teamNumber)
          )
        );

      // Shift teams above this rank up by 1
      // Use two-step update to avoid unique constraint violations:
      // Step 1: Set to negative values (won't conflict with positive ranks)
      await tx
        .update(picklistTeam)
        .set({ rank: sql`-(${picklistTeam.rank} - 1)` })
        .where(
          and(
            eq(picklistTeam.picklistId, validated.data.picklistId),
            gt(picklistTeam.rank, teamToRemove.rank)
          )
        );

      // Step 2: Convert back to positive values
      await tx
        .update(picklistTeam)
        .set({ rank: sql`-${picklistTeam.rank}` })
        .where(
          and(eq(picklistTeam.picklistId, validated.data.picklistId), sql`${picklistTeam.rank} < 0`)
        );
    });

    return { success: true };
  } catch (error) {
    console.error("Remove team from picklist error:", error);
    return { error: "Failed to remove team" };
  }
}

/**
 * Delete a picklist (cascade deletes all teams)
 */
export async function deletePicklist(data: unknown) {
  try {
    // 1. Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (!activeMember) {
      return { error: "No active organization" };
    }

    // 2. Validate input
    const validated = DeletePicklistSchema.safeParse(data);
    if (!validated.success) {
      return { error: "Invalid input" };
    }

    // 3. Verify ownership and delete
    const result = await db
      .delete(picklist)
      .where(
        and(
          eq(picklist.id, validated.data.picklistId),
          eq(picklist.organizationId, activeMember.organizationId)
        )
      )
      .returning({ id: picklist.id });

    if (result.length === 0) {
      return { error: "Picklist not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete picklist error:", error);
    return { error: "Failed to delete picklist" };
  }
}

/**
 * Reorder a team to a new rank position
 * Shifts other teams to make room
 */
export async function reorderPicklistTeam(data: unknown) {
  try {
    // 1. Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (!activeMember) {
      return { error: "No active organization" };
    }

    // 2. Validate input
    const validated = ReorderPicklistTeamSchema.safeParse(data);
    if (!validated.success) {
      return { error: "Invalid input" };
    }

    // 3. Verify picklist belongs to organization
    const picklistRecord = await db.query.picklist.findFirst({
      where: and(
        eq(picklist.id, validated.data.picklistId),
        eq(picklist.organizationId, activeMember.organizationId)
      ),
    });

    if (!picklistRecord) {
      return { error: "Picklist not found" };
    }

    // 4. Transaction: reorder team
    await db.transaction(async (tx) => {
      // Get current rank
      const [currentTeam] = await tx
        .select({ rank: picklistTeam.rank })
        .from(picklistTeam)
        .where(
          and(
            eq(picklistTeam.picklistId, validated.data.picklistId),
            eq(picklistTeam.teamNumber, validated.data.teamNumber)
          )
        )
        .limit(1);

      if (!currentTeam) {
        throw new Error("Team not found in picklist");
      }

      const oldRank = currentTeam.rank;
      const newRank = validated.data.newRank;

      if (oldRank === newRank) {
        return; // No change needed
      }

      // Remove team from old position
      await tx
        .delete(picklistTeam)
        .where(
          and(
            eq(picklistTeam.picklistId, validated.data.picklistId),
            eq(picklistTeam.teamNumber, validated.data.teamNumber)
          )
        );

      // Shift affected teams
      if (oldRank < newRank) {
        // Moving down: shift teams up between old and new rank
        await tx
          .update(picklistTeam)
          .set({ rank: sql`${picklistTeam.rank} - 1` })
          .where(
            and(
              eq(picklistTeam.picklistId, validated.data.picklistId),
              gte(picklistTeam.rank, oldRank),
              sql`${picklistTeam.rank} <= ${newRank}`
            )
          );
      } else {
        // Moving up: shift teams down between new and old rank
        await tx
          .update(picklistTeam)
          .set({ rank: sql`${picklistTeam.rank} + 1` })
          .where(
            and(
              eq(picklistTeam.picklistId, validated.data.picklistId),
              gte(picklistTeam.rank, newRank),
              sql`${picklistTeam.rank} < ${oldRank}`
            )
          );
      }

      // Insert team at new position
      await tx.insert(picklistTeam).values({
        picklistId: validated.data.picklistId,
        teamNumber: validated.data.teamNumber,
        rank: newRank,
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Reorder picklist team error:", error);
    return { error: "Failed to reorder team" };
  }
}

/**
 * Toggle the picked status of a team in a picklist
 */
export async function togglePickedStatus(data: unknown) {
  try {
    // 1. Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (!activeMember) {
      return { error: "No active organization" };
    }

    // 2. Validate input
    const validated = TogglePickedSchema.safeParse(data);
    if (!validated.success) {
      return { error: "Invalid input" };
    }

    // 3. Verify picklist belongs to organization
    const picklistRecord = await db.query.picklist.findFirst({
      where: and(
        eq(picklist.id, validated.data.picklistId),
        eq(picklist.organizationId, activeMember.organizationId)
      ),
    });

    if (!picklistRecord) {
      return { error: "Picklist not found" };
    }

    // 4. Update picked status
    await db
      .update(picklistTeam)
      .set({ picked: validated.data.picked })
      .where(
        and(
          eq(picklistTeam.picklistId, validated.data.picklistId),
          eq(picklistTeam.teamNumber, validated.data.teamNumber)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Toggle picked status error:", error);
    return { error: "Failed to update picked status" };
  }
}
