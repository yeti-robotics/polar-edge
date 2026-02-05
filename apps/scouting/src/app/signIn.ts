"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function signInDiscord(callbackURL = "/") {
  "use server";
  const response = await auth.api.signInSocial({
    body: {
      provider: "discord",
      callbackURL,
    },
    headers: await headers(),
  });

  if (response?.url) {
    redirect(response.url);
  }
}
