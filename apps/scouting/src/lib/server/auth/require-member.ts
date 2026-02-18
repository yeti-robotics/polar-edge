import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Require an authenticated user with an active organization membership.
 * Redirects to "/" if the session is missing, invalid, or has no active org.
 * Use this at the top of Server Component pages that need auth.
 */
export async function requireActiveMember() {
  // Separate try/catch from the null check — redirect() throws NEXT_REDIRECT
  // which would be caught if placed inside the catch block.
  let member = null;
  try {
    member = await auth.api.getActiveMember({ headers: await headers() });
  } catch {
    redirect("/");
  }
  if (!member) redirect("/");
  return member;
}

/**
 * Require an admin or owner role. Redirects to "/" for members and unauthenticated users.
 */
export async function requireAdminMember() {
  const member = await requireActiveMember();
  if (member.role !== "admin" && member.role !== "owner") {
    redirect("/");
  }
  return member;
}
