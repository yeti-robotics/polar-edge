"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";

/**
 * Server action to sign out the current user and redirect to home page.
 * This ensures the server state is properly updated before redirecting.
 */
export async function signOut() {
  const headerList = await headers();

  await auth.api.signOut({
    headers: headerList,
  });

  redirect(routes.home);
}
