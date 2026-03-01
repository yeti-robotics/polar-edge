import { Test, type TestingModule } from "@nestjs/testing";
import { errAsync, okAsync } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";
import { OutreachCommands } from "./outreach.commands";
import { OutreachService } from "./outreach.service";

// ─── Discord interaction helpers ─────────────────────────────────────────────

function makeInteraction(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: "user-discord-id" },
    guild: {
      id: "yeti-server-id",
      members: {
        fetch: vi.fn().mockResolvedValue({ nickname: "Test User" }),
      },
    },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ─── Service mock type ────────────────────────────────────────────────────────

type MockOutreachService = {
  getUserOutreach: MockedFunction<OutreachService["getUserOutreach"]>;
  getTotalTeamOutreachHours: MockedFunction<OutreachService["getTotalTeamOutreachHours"]>;
  getTopMembersByHours: MockedFunction<OutreachService["getTopMembersByHours"]>;
};

// ─── Module factory ───────────────────────────────────────────────────────────

function makeModule() {
  return Test.createTestingModule({
    providers: [
      OutreachCommands,
      {
        provide: OutreachService,
        useValue: {
          getUserOutreach: vi.fn(),
          getTotalTeamOutreachHours: vi.fn(),
          getTopMembersByHours: vi.fn(),
        } satisfies MockOutreachService,
      },
    ],
  }).compile();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("OutreachCommands", () => {
  let commands: OutreachCommands;
  let service: MockOutreachService;

  beforeEach(async () => {
    const module: TestingModule = await makeModule();
    commands = module.get(OutreachCommands);
    service = module.get(OutreachService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(commands).toBeDefined();
  });

  // ─── /outreach ────────────────────────────────────────────────────────────

  describe("onOutreach", () => {
    it("replies with 'must have a nickname' when member has no nickname", async () => {
      const interaction = makeInteraction({
        guild: {
          id: "yeti-server-id",
          members: { fetch: vi.fn().mockResolvedValue({ nickname: null }) },
        },
      });

      await commands.onOutreach([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        "You must have a nickname set to get outreach"
      );
      expect(service.getUserOutreach).not.toHaveBeenCalled();
    });

    it("replies with 'must have a nickname' when guild fetch returns null member", async () => {
      const interaction = makeInteraction({
        guild: {
          id: "yeti-server-id",
          members: { fetch: vi.fn().mockResolvedValue(null) },
        },
      });

      await commands.onOutreach([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        "You must have a nickname set to get outreach"
      );
    });

    it("replies with 'no outreach found' when service returns err", async () => {
      const interaction = makeInteraction();
      service.getUserOutreach.mockReturnValue(errAsync(new Error("Sheet API error")));

      await commands.onOutreach([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith("No outreach found for you");
    });

    it("shows below-rookie message with progress percentages when hours < 50", async () => {
      const interaction = makeInteraction();
      service.getUserOutreach.mockReturnValue(
        okAsync([
          {
            date: "2024-01-01",
            userName: "Test User",
            event: "Event 1",
            eventType: "Workshop",
            hours: 25,
          },
        ])
      );

      await commands.onOutreach([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("Total hours:** 25"));
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("25 more hours to reach the rookie minimum")
      );
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("50% complete"));
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("75 more hours to reach the veteran minimum")
      );
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("25% complete"));
    });

    it("shows rookie-achieved message when 50 <= hours < 100", async () => {
      const interaction = makeInteraction();
      service.getUserOutreach.mockReturnValue(
        okAsync([
          {
            date: "2024-01-01",
            userName: "Test User",
            event: "Event 1",
            eventType: "Workshop",
            hours: 75,
          },
        ])
      );

      await commands.onOutreach([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("Total hours:** 75"));
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("✅ Rookie minimum achieved!")
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("25 more hours to reach the veteran minimum")
      );
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("75% complete"));
    });

    it("shows veteran-achieved message when hours >= 100", async () => {
      const interaction = makeInteraction();
      service.getUserOutreach.mockReturnValue(
        okAsync([
          {
            date: "2024-01-01",
            userName: "Test User",
            event: "Event 1",
            eventType: "Workshop",
            hours: 120,
          },
        ])
      );

      await commands.onOutreach([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("Total hours:** 120"));
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("🎉 Veteran minimum achieved!")
      );
    });

    it("shows 0 hours with full progress remaining when outreach is empty", async () => {
      const interaction = makeInteraction();
      service.getUserOutreach.mockReturnValue(okAsync([]));

      await commands.onOutreach([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("Total hours:** 0"));
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("50 more hours to reach the rookie minimum")
      );
    });

    it("sums hours across multiple outreach entries", async () => {
      const interaction = makeInteraction();
      service.getUserOutreach.mockReturnValue(
        okAsync([
          {
            date: "2024-01-01",
            userName: "Test User",
            event: "Event 1",
            eventType: "Workshop",
            hours: 60,
          },
          {
            date: "2024-01-02",
            userName: "Test User",
            event: "Event 2",
            eventType: "Outreach",
            hours: 60,
          },
        ])
      );

      await commands.onOutreach([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("Total hours:** 120"));
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("🎉 Veteran minimum achieved!")
      );
    });

    it("includes the correction contact message", async () => {
      const interaction = makeInteraction();
      service.getUserOutreach.mockReturnValue(okAsync([]));

      await commands.onOutreach([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("Please reach out to Ms. I")
      );
    });

    it("calls getUserOutreach with the member's nickname", async () => {
      const interaction = makeInteraction();
      service.getUserOutreach.mockReturnValue(okAsync([]));

      await commands.onOutreach([interaction] as never);

      expect(service.getUserOutreach).toHaveBeenCalledWith("Test User");
    });
  });

  // ─── /outreach-leaderboard ────────────────────────────────────────────────

  describe("onOutreachLeaderboard", () => {
    it("replies with 'no outreach data found' when leaderboard service returns err", async () => {
      const interaction = makeInteraction();
      service.getTopMembersByHours.mockReturnValue(errAsync(new Error("Sheet error")));
      service.getTotalTeamOutreachHours.mockReturnValue(okAsync(100));

      await commands.onOutreachLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith("No outreach data found");
    });

    it("replies with 'no outreach data found' when leaderboard is empty", async () => {
      const interaction = makeInteraction();
      service.getTopMembersByHours.mockReturnValue(okAsync([]));
      service.getTotalTeamOutreachHours.mockReturnValue(okAsync(0));

      await commands.onOutreachLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith("No outreach data found");
    });

    it("shows leaderboard with medal emojis for top 3 and numbers for 4th/5th", async () => {
      const interaction = makeInteraction();
      service.getTopMembersByHours.mockReturnValue(
        okAsync([
          { userName: "Alice", totalHours: 120 },
          { userName: "Bob", totalHours: 90 },
          { userName: "Carol", totalHours: 60 },
          { userName: "Dave", totalHours: 40 },
          { userName: "Eve", totalHours: 20 },
        ])
      );
      service.getTotalTeamOutreachHours.mockReturnValue(okAsync(330));

      await commands.onOutreachLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining(":first_place_medal:")
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining(":second_place_medal:")
      );
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining(":third_place_medal:")
      );
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("4."));
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("5."));
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("Alice"));
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("Eve"));
    });

    it("shows team total hours in the header", async () => {
      const interaction = makeInteraction();
      service.getTopMembersByHours.mockReturnValue(
        okAsync([{ userName: "Alice", totalHours: 100 }])
      );
      service.getTotalTeamOutreachHours.mockReturnValue(okAsync(250));

      await commands.onOutreachLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("Team Total: 250 hours")
      );
    });

    it("shows team total as 0 when getTotalTeamOutreachHours returns err", async () => {
      const interaction = makeInteraction();
      service.getTopMembersByHours.mockReturnValue(
        okAsync([{ userName: "Alice", totalHours: 100 }])
      );
      service.getTotalTeamOutreachHours.mockReturnValue(errAsync(new Error("Sheet error")));

      await commands.onOutreachLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("Team Total: 0 hours")
      );
    });

    it("includes 'Updated in real-time' footer", async () => {
      const interaction = makeInteraction();
      service.getTopMembersByHours.mockReturnValue(
        okAsync([{ userName: "Alice", totalHours: 100 }])
      );
      service.getTotalTeamOutreachHours.mockReturnValue(okAsync(100));

      await commands.onOutreachLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("Updated in real-time from outreach records")
      );
    });

    it("calls getTopMembersByHours with limit 5", async () => {
      const interaction = makeInteraction();
      service.getTopMembersByHours.mockReturnValue(okAsync([]));
      service.getTotalTeamOutreachHours.mockReturnValue(okAsync(0));

      await commands.onOutreachLeaderboard([interaction] as never);

      expect(service.getTopMembersByHours).toHaveBeenCalledWith(5);
    });
  });
});
