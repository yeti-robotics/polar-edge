"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";

export type UpdateOrganizationNameState = {
  data: { success: true } | null;
  error: string | null;
};

export async function updateOrganizationNameAction(
  _prevState: UpdateOrganizationNameState,
  formData: FormData
): Promise<UpdateOrganizationNameState> {
  try {
    const organizationId = formData.get("organizationId") as string;
    const name = formData.get("name") as string;

    const requestHeaders = await headers();
    const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

    if (!activeMember || activeMember.organizationId !== organizationId) {
      return {
        data: null,
        error: "Only organization admins and owners can update settings",
      };
    }

    const { success: canUpdate } = await auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { organization: ["update"] } },
    });
    if (!canUpdate) {
      return {
        data: null,
        error: "Only organization admins and owners can update settings",
      };
    }

    const trimmedName = name?.trim();
    if (!trimmedName) {
      return { data: null, error: "Organization name is required" };
    }
    if (trimmedName.length > 100) {
      return { data: null, error: "Organization name must be 100 characters or less" };
    }

    await auth.api.updateOrganization({
      body: { data: { name: trimmedName }, organizationId },
      headers: requestHeaders,
    });

    revalidatePath(routes.admin.settings);
    return { data: { success: true }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update organization name",
    };
  }
}
