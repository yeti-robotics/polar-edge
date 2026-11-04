import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { logDiscordOAuthCallback } from "@/lib/server/auth/discord-oauth-logging";

const { GET: handleGet, POST } = toNextJsHandler(auth);

export async function GET(request: Request) {
  return logDiscordOAuthCallback(request, handleGet);
}

export { POST };
