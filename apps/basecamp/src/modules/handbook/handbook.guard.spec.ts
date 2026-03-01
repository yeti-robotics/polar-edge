import { ExecutionContext } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { type ThrottlerLimitDetail, ThrottlerModule } from "@nestjs/throttler";
import { MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NecordThrottlerGuard } from "./handbook.guard";

// ─── Discord interaction helpers ─────────────────────────────────────────────

function makeInteraction(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: "user-123" },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeContext(interaction: ReturnType<typeof makeInteraction>): ExecutionContext {
  return {
    getArgByIndex: vi.fn().mockReturnValue([interaction]),
  } as unknown as ExecutionContext;
}

// ─── Guard internal type ──────────────────────────────────────────────────────

type GuardInternal = {
  getRequestResponse: (ctx: ExecutionContext) => { req: unknown; res: unknown };
  getTracker: (req: { user: { id: string } }) => Promise<string>;
  throwThrottlingException: (ctx: ExecutionContext, detail: ThrottlerLimitDetail) => Promise<void>;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("NecordThrottlerGuard", () => {
  let guard: NecordThrottlerGuard;
  let internal: GuardInternal;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ name: "default", limit: 2, ttl: 60000 }])],
      providers: [NecordThrottlerGuard],
    }).compile();

    guard = module.get(NecordThrottlerGuard);
    internal = guard as unknown as GuardInternal;
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("getRequestResponse", () => {
    it("returns the interaction as both req and res", () => {
      const interaction = makeInteraction();
      const context = makeContext(interaction);

      const { req, res } = internal.getRequestResponse(context);

      expect(req).toBe(interaction);
      expect(res).toBe(interaction);
    });
  });

  describe("getTracker", () => {
    it("returns the user id from the interaction", async () => {
      const interaction = makeInteraction();

      const tracker = await internal.getTracker(interaction);

      expect(tracker).toBe("user-123");
    });
  });

  describe("throwThrottlingException", () => {
    it("replies with an ephemeral message containing the wait time in seconds", async () => {
      const interaction = makeInteraction();
      const context = makeContext(interaction);
      const detail = { timeToExpire: 30000 } as ThrottlerLimitDetail;

      await internal.throwThrottlingException(context, detail);

      expect(interaction.reply).toHaveBeenCalledWith({
        content: expect.stringContaining("30 seconds"),
        flags: [MessageFlags.Ephemeral],
      });
    });

    it("rounds up a partial second", async () => {
      const interaction = makeInteraction();
      const context = makeContext(interaction);
      const detail = { timeToExpire: 30500 } as ThrottlerLimitDetail;

      await internal.throwThrottlingException(context, detail);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({ content: expect.stringContaining("31 seconds") })
      );
    });
  });
});
