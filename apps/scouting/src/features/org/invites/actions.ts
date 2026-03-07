"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { routes } from "@/lib/routes";
import {
  acceptInviteLink as acceptLink,
  generateInviteLink as generateLink,
  revokeInviteLink as revokeLink,
} from "@/lib/server/invite-links";
import { getBaseUrl } from "@/lib/utils";

export async function generateInviteLink() {
  try {
    const link = await generateLink();
    if (!link) {
      throw new Error("Failed to generate invite link");
    }
    const baseUrl = getBaseUrl();
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
    revalidatePath(routes.admin.invites);
    return { data: { success: true }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to revoke invite link",
    };
  }
}

export async function acceptInviteLink(token: string) {
  try {
    await acceptLink(token);
    revalidatePath(routes.home);
    return { data: { success: true }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to accept invite link",
    };
  }
}

export async function setPendingInviteCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("pending_invite_token", token, {
    maxAge: 60 * 10, // 10 minutes
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}
