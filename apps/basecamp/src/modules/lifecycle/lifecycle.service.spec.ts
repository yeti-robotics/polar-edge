import { Test, type TestingModule } from "@nestjs/testing";
import { ActivityType } from "discord.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LifecycleService } from "./lifecycle.service";

// ─── Client helper ────────────────────────────────────────────────────────────

function makeClient(username = "TestBot") {
  return {
    user: {
      username,
      setActivity: vi.fn(),
    },
  };
}

// ─── Module factory ───────────────────────────────────────────────────────────

async function makeModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    providers: [LifecycleService],
  }).compile();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LifecycleService", () => {
  let service: LifecycleService;

  beforeEach(async () => {
    const module = await makeModule();
    service = module.get(LifecycleService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ─── onReady ──────────────────────────────────────────────────────────────

  describe("onReady", () => {
    it("logs the bot username when ready", async () => {
      const client = makeClient("YetiBot");
      // biome-ignore lint/complexity/useLiteralKeys: accessing private field in test
      const logSpy = vi.spyOn(service["logger"], "log");

      await service.onReady([client] as never);

      expect(logSpy).toHaveBeenCalledWith("Bot logged in as YetiBot");
    });

    it("sets activity to 'YETI ARE YOU READY?' with Custom type", async () => {
      const client = makeClient("YetiBot");

      await service.onReady([client] as never);

      expect(client.user.setActivity).toHaveBeenCalledWith("YETI ARE YOU READY?", {
        type: ActivityType.Custom,
      });
    });

    it("calls setActivity exactly once", async () => {
      const client = makeClient();

      await service.onReady([client] as never);

      expect(client.user.setActivity).toHaveBeenCalledTimes(1);
    });

    it("logs with username from client.user.username", async () => {
      const client = makeClient("AnotherBot");
      // biome-ignore lint/complexity/useLiteralKeys: accessing private field in test
      const logSpy = vi.spyOn(service["logger"], "log");

      await service.onReady([client] as never);

      expect(logSpy).toHaveBeenCalledWith("Bot logged in as AnotherBot");
    });

    it("resolves without returning a value (void)", async () => {
      const client = makeClient();

      const result = await service.onReady([client] as never);

      expect(result).toBeUndefined();
    });
  });
});
