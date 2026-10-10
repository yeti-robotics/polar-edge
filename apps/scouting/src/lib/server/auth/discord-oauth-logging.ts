import { createHash } from "node:crypto";

const DISCORD_CALLBACK_PATH = "/api/auth/callback/discord";
const AUTH_ERROR_PATH = "/api/auth/error";

export function getDiscordOAuthAttemptId(state: string | null): string {
  if (!state) return "missing";

  // OAuth state is random. A short digest correlates requests without logging the state itself.
  return createHash("sha256").update(state).digest("hex").slice(0, 20);
}

export function logDiscordOAuthStart(authorizationUrl: string): void {
  let state: string | null = null;
  try {
    state = new URL(authorizationUrl).searchParams.get("state");
  } catch {
    // Diagnostic logging must never interrupt sign-in.
  }
  console.info("[discord-oauth] sign_in_started", {
    attemptId: getDiscordOAuthAttemptId(state),
  });
}

function getCallbackOutcome(response: Response, requestUrl: string): string {
  const location = response.headers.get("location");
  if (!location) return response.ok ? "completed" : "http_error";

  try {
    const destination = new URL(location, requestUrl);
    const request = new URL(requestUrl);
    if (destination.origin !== request.origin || destination.pathname !== AUTH_ERROR_PATH) {
      return "redirected";
    }

    return destination.searchParams.get("error") === "invalid_code"
      ? "token_exchange_error"
      : "auth_error";
  } catch {
    return "redirected";
  }
}

export async function logDiscordOAuthCallback(
  request: Request,
  handler: (request: Request) => Promise<Response>
): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== DISCORD_CALLBACK_PATH) return handler(request);

  const attemptId = getDiscordOAuthAttemptId(url.searchParams.get("state"));
  const startedAt = performance.now();
  console.info("[discord-oauth] callback_received", {
    attemptId,
    codePresent: url.searchParams.has("code"),
    providerError: url.searchParams.has("error"),
  });

  try {
    const response = await handler(request);
    console.info("[discord-oauth] callback_completed", {
      attemptId,
      outcome: getCallbackOutcome(response, request.url),
      status: response.status,
      durationMs: Math.round(performance.now() - startedAt),
    });
    return response;
  } catch (error) {
    console.error("[discord-oauth] callback_failed", {
      attemptId,
      durationMs: Math.round(performance.now() - startedAt),
    });
    throw error;
  }
}
