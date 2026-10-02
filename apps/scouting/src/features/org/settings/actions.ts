"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";
import { COPR_FALLBACK_METADATA_KEY, getOrganizationMetadata } from "./organization-settings";

export type UpdateOrganizationNameState = {
  data: { success: true } | null;
  error: string | null;
};

export type UpdateCoprFallbackState = UpdateOrganizationNameState;

async function authorizeOrganizationUpdate(organizationId: string) {
  const requestHeaders = await headers();
  const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });
  const canUpdate =
    activeMember?.organizationId === organizationId &&
    (
      await auth.api.hasPermission({
        headers: requestHeaders,
        body: { permissions: { organization: ["update"] } },
      })
    ).success;

  if (!canUpdate) {
    return {
      error: {
        data: null,
        error: "Only organization admins and owners can update settings",
      } satisfies UpdateOrganizationNameState,
    };
  }

  return { requestHeaders };
}

export async function updateOrganizationNameAction(
  _prevState: UpdateOrganizationNameState,
  formData: FormData
): Promise<UpdateOrganizationNameState> {
  try {
    const organizationId = formData.get("organizationId") as string;
    const name = formData.get("name") as string;

    const authorization = await authorizeOrganizationUpdate(organizationId);
    if (authorization.error) return authorization.error;
    const { requestHeaders } = authorization;

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

export async function updateCoprFallbackAction(
  organizationId: string,
  enabled: boolean
): Promise<UpdateCoprFallbackState> {
  try {
    const authorization = await authorizeOrganizationUpdate(organizationId);
    if (authorization.error) return authorization.error;
    const { requestHeaders } = authorization;

    const current = await auth.api.getFullOrganization({
      query: { organizationId },
      headers: requestHeaders,
    });
    if (!current) {
      return { data: null, error: "Organization not found" };
    }

    await auth.api.updateOrganization({
      body: {
        organizationId,
        data: {
          metadata: {
            ...getOrganizationMetadata(current.metadata),
            [COPR_FALLBACK_METADATA_KEY]: enabled,
          },
        },
      },
      headers: requestHeaders,
    });

    revalidatePath(routes.admin.settings);
    return { data: { success: true }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update COPR fallback",
    };
  }
}
