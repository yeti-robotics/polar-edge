"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function updateMemberRole(memberId: string, role: string) {
  try {
    const requestHeaders = await headers();
    const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

    if (!activeMember) {
      return { data: null, error: "Not authenticated" };
    }

    if (activeMember.role !== "admin" && activeMember.role !== "owner") {
      return { data: null, error: "You do not have permission to update roles" };
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
