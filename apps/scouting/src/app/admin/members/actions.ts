"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { member } from "@/lib/database/schema/tables/member";
import { session } from "@/lib/database/schema/tables/session";
import { user } from "@/lib/database/schema/tables/user";

export async function updateMemberRole(memberId: string, role: string) {
  try {
    const requestHeaders = await headers();
    const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

    if (!activeMember) {
      return { data: null, error: "Not authenticated" };
    }

    const { success: canUpdate } = await auth.api.hasPermission({
      headers: requestHeaders,
      body: { permission: { member: ["update"] } },
    });
    if (!canUpdate) {
      return { data: null, error: "You do not have permission to update roles" };
    }

    // Only owners can promote to owner
    if (role === "owner" && activeMember.role !== "owner") {
      return { data: null, error: "Only owners can assign the owner role" };
    }

    // Verify target member belongs to the caller's organization
    const targetMember = await db.query.member.findFirst({
      where: eq(member.id, memberId),
    });

    if (!targetMember) {
      return { data: null, error: "Member not found" };
    }

    if (targetMember.organizationId !== activeMember.organizationId) {
      return { data: null, error: "Member not in your organization" };
    }

    await auth.api.updateMemberRole({
      headers: requestHeaders,
      body: {
        memberId,
        role,
        organizationId: activeMember.organizationId,
      },
    });

    revalidatePath("/admin/members");
    return { data: { success: true }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update member role",
    };
  }
}

export async function removeMember(memberId: string) {
  try {
    const requestHeaders = await headers();
    const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

    if (!activeMember) {
      return { data: null, error: "Not authenticated" };
    }

    // Only admins and owners can remove members
    const { success: canDelete } = await auth.api.hasPermission({
      headers: requestHeaders,
      body: { permission: { member: ["delete"] } },
    });
    if (!canDelete) {
      return { data: null, error: "You do not have permission to remove members" };
    }

    // Get the member to be removed
    const memberToRemove = await db.query.member.findFirst({
      where: eq(member.id, memberId),
    });

    if (!memberToRemove) {
      return { data: null, error: "Member not found" };
    }

    // Prevent removing member from different organization
    if (memberToRemove.organizationId !== activeMember.organizationId) {
      return { data: null, error: "Member not in your organization" };
    }

    // Owner cannot be removed
    if (memberToRemove.role === "owner") {
      return { data: null, error: "Cannot remove the organization owner" };
    }

    // Admins cannot remove other admins or owners
    if (activeMember.role === "admin" && memberToRemove.role === "admin") {
      return { data: null, error: "Admins cannot remove other admins" };
    }

    // Prevent self-removal
    if (activeMember.id === memberId) {
      return { data: null, error: "Cannot remove yourself" };
    }

    const userId = memberToRemove.userId;

    // Use transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Delete the member record (this will set scoutMemberId to null in forms due to schema)
      await tx.delete(member).where(eq(member.id, memberId));

      // Clear activeOrganizationId from all sessions for this user
      await tx
        .update(session)
        .set({ activeOrganizationId: null })
        .where(eq(session.userId, userId));

      // Check if user has any other organization memberships
      const remainingMemberships = await tx.query.member.findMany({
        where: eq(member.userId, userId),
      });

      // If no other memberships exist, delete the user account
      if (remainingMemberships.length === 0) {
        await tx.delete(user).where(eq(user.id, userId));
      }
    });

    revalidatePath("/admin/members");
    return { data: { success: true }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to remove member",
    };
  }
}
