"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";

export async function signOut() {
  const headerList = await headers();

  await auth.api.signOut({
    headers: headerList,
  });

  redirect(routes.home);
}
