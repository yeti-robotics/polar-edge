const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? [];

/**
 * Check if a user is a super admin by email.
 * Uses email (not display name) so permissions can't be spoofed by changing Discord username.
 */
export function isSuperAdmin(userEmail: string) {
  if (!userEmail) return false;
  return ADMIN_EMAILS.includes(userEmail.trim().toLowerCase());
}
