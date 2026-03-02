import { Test, type TestingModule } from "@nestjs/testing";
import { MessageFlags } from "discord.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LifecycleCommands } from "./lifecycle.commands";

// ─── Interaction helper ───────────────────────────────────────────────────────

function makeInteraction(ping = 42) {
  return {
    client: {
      ws: { ping },
    },
    reply: vi.fn().mockResolvedValue(undefined),
  };
}

// ─── Module factory ───────────────────────────────────────────────────────────

async function makeModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    providers: [LifecycleCommands],
  }).compile();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LifecycleCommands", () => {
  let commands: LifecycleCommands;

  beforeEach(async () => {
    const module = await makeModule();
    commands = module.get(LifecycleCommands);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(commands).toBeDefined();
  });

  // ─── /ping ────────────────────────────────────────────────────────────────

  describe("onPing", () => {
    it("replies with Pong! and the ws ping in ms", async () => {
      const interaction = makeInteraction(123);

      await commands.onPing([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Pong! 123ms",
        })
      );
    });

    it("replies with Ephemeral flag", async () => {
      const interaction = makeInteraction(50);

      await commands.onPing([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          flags: [MessageFlags.Ephemeral],
        })
      );
    });

    it("calls reply exactly once", async () => {
      const interaction = makeInteraction();

      await commands.onPing([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledTimes(1);
    });

    it("reflects the actual ws.ping value in the reply", async () => {
      const interaction = makeInteraction(999);

      await commands.onPing([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Pong! 999ms",
        })
      );
    });

    it("returns the result of interaction.reply", async () => {
      const interaction = makeInteraction();
      const sentinel = Symbol("reply-result");
      interaction.reply.mockResolvedValue(sentinel as never);

      const result = await commands.onPing([interaction] as never);

      expect(result).toBe(sentinel);
    });

    it("propagates rejection if interaction.reply throws", async () => {
      const interaction = makeInteraction();
      interaction.reply.mockRejectedValue(new Error("Discord API error"));

      await expect(commands.onPing([interaction] as never)).rejects.toThrow("Discord API error");
    });
  });
});
