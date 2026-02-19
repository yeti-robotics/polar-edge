"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
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
