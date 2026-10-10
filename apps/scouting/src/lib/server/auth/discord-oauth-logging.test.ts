import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getDiscordOAuthAttemptId,
  logDiscordOAuthCallback,
  logDiscordOAuthStart,
} from "./discord-oauth-logging";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Discord OAuth logging", () => {
  it("correlates a sign-in with its callback without logging OAuth secrets", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const state = "private-oauth-state";
    const code = "private-authorization-code";
    logDiscordOAuthStart(`https://discord.com/oauth2/authorize?state=${state}`);

    const request = new Request(
      `https://scout.yetirobotics.org/api/auth/callback/discord?state=${state}&code=${code}`
    );
    const response = Response.redirect("https://scout.yetirobotics.org/analysis", 302);
    expect(await logDiscordOAuthCallback(request, async () => response)).toBe(response);

    const attemptId = getDiscordOAuthAttemptId(state);
    expect(info).toHaveBeenCalledWith("[discord-oauth] sign_in_started", { attemptId });
    expect(info).toHaveBeenCalledWith("[discord-oauth] callback_received", {
      attemptId,
      codePresent: true,
      providerError: false,
    });
    expect(info).toHaveBeenCalledWith(
      "[discord-oauth] callback_completed",
      expect.objectContaining({ attemptId, outcome: "redirected", status: 302 })
    );
    expect(JSON.stringify(info.mock.calls)).not.toContain(state);
    expect(JSON.stringify(info.mock.calls)).not.toContain(code);
  });

  it("identifies token exchange errors without logging the redirect or description", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const request = new Request(
      "https://scout.yetirobotics.org/api/auth/callback/discord?state=private-state&code=private-code"
    );
    const response = Response.redirect(
      "https://scout.yetirobotics.org/api/auth/error?error=invalid_code&error_description=private-detail",
      302
    );

    await logDiscordOAuthCallback(request, async () => response);

    expect(info).toHaveBeenCalledWith(
      "[discord-oauth] callback_completed",
      expect.objectContaining({ outcome: "token_exchange_error" })
    );
    expect(JSON.stringify(info.mock.calls)).not.toContain("private-detail");
    expect(JSON.stringify(info.mock.calls)).not.toContain("private-code");
  });

  it("does not log unrelated auth requests", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const request = new Request("https://scout.yetirobotics.org/api/auth/get-session");
    const response = new Response(null, { status: 204 });

    expect(await logDiscordOAuthCallback(request, async () => response)).toBe(response);
    expect(info).not.toHaveBeenCalled();
  });

  it("logs a callback handler failure without exposing the thrown error", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    const request = new Request(
      "https://scout.yetirobotics.org/api/auth/callback/discord?state=private-state"
    );

    await expect(
      logDiscordOAuthCallback(request, async () => {
        throw new Error("private-error-detail");
      })
    ).rejects.toThrow("private-error-detail");

    expect(errorLog).toHaveBeenCalledWith(
      "[discord-oauth] callback_failed",
      expect.objectContaining({ attemptId: getDiscordOAuthAttemptId("private-state") })
    );
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("private-error-detail");
  });
});
