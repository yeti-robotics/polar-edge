"use server";

import { revalidatePath } from "next/cache";
import {
  generateInviteLink as generateLink,
  revokeInviteLink as revokeLink,
} from "@/lib/server/invite-links";

export async function generateInviteLink() {
  try {
    const link = await generateLink();
    if (!link) {
      throw new Error("Failed to generate invite link");
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
      data: {
        ...link,
        url: `${baseUrl}/join/${link.token}`,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to generate invite link",
    };
  }
}

export async function revokeInviteLink(token: string) {
  try {
    await revokeLink(token);
    revalidatePath("/admin/invites");
    return { data: { success: true }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to revoke invite link",
    };
  }
}
