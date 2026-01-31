"use server";

import { revalidatePath } from "next/cache";
import { setActiveEventForOrganization } from "@/lib/server/organization/active-event";

export async function setActiveEventAction(organizationId: string, eventId: string) {
  try {
    await setActiveEventForOrganization(organizationId, eventId);
    revalidatePath("/admin/event");
    return { data: { success: true }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to set active event",
    };
  }
}
