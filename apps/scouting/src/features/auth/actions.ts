"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { logDiscordOAuthStart } from "@/lib/server/auth/discord-oauth-logging";

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
    logDiscordOAuthStart(response.url);
    redirect(response.url);
  }
}
