import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";

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
    redirect(routes.login);
  }
  if (!member) redirect(routes.login);
  return member;
}

/**
 * Require an admin or owner role. Redirects to "/" for members and unauthenticated users.
 */
export async function requireAdminMember() {
  const member = await requireActiveMember();
  if (member.role !== "admin" && member.role !== "owner") {
    redirect(routes.login);
  }
  return member;
}

const SCOUT_LEAD_ROLES = new Set(["scout_lead", "admin", "owner"]);

/**
 * Require scout_lead, admin, or owner role. Redirects to "/" otherwise.
 */
export async function requireScoutLeadMember() {
  const member = await requireActiveMember();
  if (!SCOUT_LEAD_ROLES.has(member.role)) {
    redirect(routes.login);
  }
  return member;
}

/**
 * Check if a role has scout lead (or higher) permissions.
 */
export function isScoutLeadOrAbove(role: string) {
  return SCOUT_LEAD_ROLES.has(role);
}
