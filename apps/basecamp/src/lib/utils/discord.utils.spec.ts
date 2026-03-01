import type { ChatInputCommandInteraction } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { getNickname } from "./discord.utils";

function makeInteraction(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: "user-discord-id" },
    guild: {
      id: "yeti-server-id",
    },
    ...overrides,
  } as ChatInputCommandInteraction;
}

describe("getNickname", () => {
  it("should return the nickname of the user", async () => {
    const interaction = makeInteraction({
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({ nickname: "Test User" }),
        },
      },
    });

    const result = await getNickname(interaction);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe("Test User");
  });

  it("should return an error when the discord fetch fails", async () => {
    const interaction = makeInteraction({
      guild: {
        members: { fetch: vi.fn().mockRejectedValue(new Error("Failed to fetch")) },
      },
    });

    const result = await getNickname(interaction);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain("Failed to fetch");
  });

  it("should return an error when the nickname is not found", async () => {
    const interaction = makeInteraction({
      guild: {
        members: { fetch: vi.fn().mockResolvedValue({ nickname: null }) },
      },
    });

    const result = await getNickname(interaction);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain("Nickname not found");
  });

  it("should return an error when there is no guild", async () => {
    const interaction = makeInteraction({ guild: null });

    const result = await getNickname(interaction);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain("Guild not found");
  });

  it("should return an error wrapping a non-Error rejection value", async () => {
    const interaction = makeInteraction({
      guild: {
        members: { fetch: vi.fn().mockRejectedValue("string rejection") },
      },
    });

    const result = await getNickname(interaction);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain("string rejection");
  });
});
