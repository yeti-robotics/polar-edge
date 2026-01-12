"use server";

import { revalidatePath } from "next/cache";
import { acceptInviteLink as acceptLink } from "@/lib/server/invite-links";

export async function acceptInviteLink(token: string) {
  try {
    await acceptLink(token);
    revalidatePath("/");
    return { data: { success: true }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to accept invite link",
    };
  }
}
