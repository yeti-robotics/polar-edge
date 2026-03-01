import { AppConfigService } from "src/config/config.service";
import { Test, type TestingModule } from "@nestjs/testing";
import { errAsync, okAsync } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";
import { AttendanceCommands } from "./attendance.commands";
import { AttendanceService } from "./attendance.service";

// ─── Discord interaction helpers ─────────────────────────────────────────────

function makeInteraction(overrides: Record<string, unknown> = {}) {
  const interaction = {
    user: { id: "user-discord-id" },
    guild: {
      id: "yeti-server-id",
      members: {
        fetch: vi.fn().mockResolvedValue({ nickname: "Test User" }),
      },
    },
    guildId: "yeti-server-id",
    channel: {
      isSendable: vi.fn().mockReturnValue(true),
      send: vi.fn().mockResolvedValue(undefined),
    },
    member: {
      roles: {
        cache: {
          has: vi.fn().mockReturnValue(true),
        },
      },
    },
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return interaction;
}

// ─── Service mock type ────────────────────────────────────────────────────────

type MockAttendanceService = {
  signIn: MockedFunction<AttendanceService["signIn"]>;
  signOut: MockedFunction<AttendanceService["signOut"]>;
  getUserHours: MockedFunction<AttendanceService["getUserHours"]>;
  getUserRank: MockedFunction<AttendanceService["getUserRank"]>;
  getTopMembersByHours: MockedFunction<AttendanceService["getTopMembersByHours"]>;
  getTotalPossibleHoursToDate: MockedFunction<AttendanceService["getTotalPossibleHoursToDate"]>;
};

// ─── Module factory ───────────────────────────────────────────────────────────

function makeModule() {
  return Test.createTestingModule({
    providers: [
      AttendanceCommands,
      {
        provide: AttendanceService,
        useValue: {
          signIn: vi.fn(),
          signOut: vi.fn(),
          getUserHours: vi.fn(),
          getUserRank: vi.fn(),
          getTopMembersByHours: vi.fn(),
          getTotalPossibleHoursToDate: vi.fn().mockReturnValue(100),
        } satisfies MockAttendanceService,
      },
      {
        provide: AppConfigService,
        useValue: {
          get: vi.fn().mockReturnValue("admin-role-id"),
        },
      },
    ],
  }).compile();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AttendanceCommands", () => {
  let commands: AttendanceCommands;
  let service: MockAttendanceService;

  beforeEach(async () => {
    const module: TestingModule = await makeModule();
    commands = module.get(AttendanceCommands);
    service = module.get(AttendanceService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(commands).toBeDefined();
  });

  // ─── /signin ─────────────────────────────────────────────────────────────

  describe("onSignIn", () => {
    it("replies with 'must have a nickname' when member has no nickname", async () => {
      const interaction = makeInteraction({
        guild: {
          id: "yeti-server-id",
          members: { fetch: vi.fn().mockResolvedValue({ nickname: null }) },
        },
      });

      await commands.onSignIn([interaction] as never, { code: 123456 });

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "You must have a nickname to sign in",
      });
      expect(service.signIn).not.toHaveBeenCalled();
    });

    it("replies with 'must have a nickname' when guild fetch returns null member", async () => {
      const interaction = makeInteraction({
        guild: {
          id: "yeti-server-id",
          members: { fetch: vi.fn().mockResolvedValue(null) },
        },
      });

      await commands.onSignIn([interaction] as never, { code: 123456 });

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "You must have a nickname to sign in",
      });
    });

    it("replies with unexpected error when signIn returns err", async () => {
      const interaction = makeInteraction();
      service.signIn.mockReturnValue(errAsync(new Error("sheet error")));

      await commands.onSignIn([interaction] as never, { code: 123456 });

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "An unexpected error occurred.",
      });
    });

    it("announces to channel and confirms on successful sign-in", async () => {
      const interaction = makeInteraction();
      service.signIn.mockReturnValue(okAsync({ success: true }));

      await commands.onSignIn([interaction] as never, { code: 123456 });

      expect(interaction.channel.send).toHaveBeenCalledWith("<@user-discord-id> has signed in.");
      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "Signed in successfully",
      });
    });

    it("uses custom success message when provided", async () => {
      const interaction = makeInteraction();
      service.signIn.mockReturnValue(
        okAsync({ success: true, message: "You were auto-credited." })
      );

      await commands.onSignIn([interaction] as never, { code: 123456 });

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "You were auto-credited.",
      });
    });

    it("skips channel send when channel is not sendable", async () => {
      const interaction = makeInteraction({
        channel: {
          isSendable: vi.fn().mockReturnValue(false),
          send: vi.fn(),
        },
      });
      service.signIn.mockReturnValue(okAsync({ success: true }));

      await commands.onSignIn([interaction] as never, { code: 123456 });

      expect(interaction.channel.send).not.toHaveBeenCalled();
      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "Signed in successfully",
      });
    });

    it("replies with failure message on unsuccessful sign-in", async () => {
      const interaction = makeInteraction();
      service.signIn.mockReturnValue(okAsync({ success: false, message: "Invalid code." }));

      await commands.onSignIn([interaction] as never, { code: 999999 });

      expect(interaction.channel.send).not.toHaveBeenCalled();
      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "Invalid code.",
      });
    });

    it("falls back to default failure message when message is absent", async () => {
      const interaction = makeInteraction();
      service.signIn.mockReturnValue(
        okAsync({
          success: false,
          message: "Failed to sign in. Please try again or let a mentor know.",
        })
      );

      await commands.onSignIn([interaction] as never, { code: 123456 });

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "Failed to sign in. Please try again or let a mentor know.",
      });
    });

    it("passes code and guild id to attendanceService.signIn", async () => {
      const interaction = makeInteraction();
      service.signIn.mockReturnValue(okAsync({ success: true }));

      await commands.onSignIn([interaction] as never, { code: 555555 });

      expect(service.signIn).toHaveBeenCalledWith(
        "user-discord-id",
        "yeti-server-id",
        "Test User",
        555555
      );
    });

    it("falls back to empty string guild id when guild has no id", async () => {
      const interaction = makeInteraction({
        guild: {
          id: undefined,
          members: { fetch: vi.fn().mockResolvedValue({ nickname: "Test User" }) },
        },
      });
      service.signIn.mockReturnValue(okAsync({ success: true }));

      await commands.onSignIn([interaction] as never, { code: 123456 });

      expect(service.signIn).toHaveBeenCalledWith("user-discord-id", "", "Test User", 123456);
    });
  });

  // ─── /signout ────────────────────────────────────────────────────────────

  describe("onSignOut", () => {
    it("replies with 'must have a nickname' when member has no nickname", async () => {
      const interaction = makeInteraction({
        guild: {
          id: "yeti-server-id",
          members: { fetch: vi.fn().mockResolvedValue({ nickname: null }) },
        },
      });

      await commands.onSignOut([interaction] as never, { code: 123456 });

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "You must have a nickname to sign out",
      });
      expect(service.signOut).not.toHaveBeenCalled();
    });

    it("replies with unexpected error when signOut returns err", async () => {
      const interaction = makeInteraction();
      service.signOut.mockReturnValue(errAsync(new Error("sheet error")));

      await commands.onSignOut([interaction] as never, { code: 123456 });

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "An unexpected error occurred.",
      });
    });

    it("announces to channel and confirms on successful sign-out", async () => {
      const interaction = makeInteraction();
      service.signOut.mockReturnValue(okAsync({ success: true }));

      await commands.onSignOut([interaction] as never, { code: 123456 });

      expect(interaction.channel.send).toHaveBeenCalledWith("<@user-discord-id> has signed out.");
      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "Signed out successfully",
      });
    });

    it("uses custom success message when provided", async () => {
      const interaction = makeInteraction();
      service.signOut.mockReturnValue(
        okAsync({ success: true, message: "Signed out with 1.5h credit." })
      );

      await commands.onSignOut([interaction] as never, { code: 123456 });

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "Signed out with 1.5h credit.",
      });
    });

    it("skips channel send when channel is not sendable", async () => {
      const interaction = makeInteraction({
        channel: {
          isSendable: vi.fn().mockReturnValue(false),
          send: vi.fn(),
        },
      });
      service.signOut.mockReturnValue(okAsync({ success: true }));

      await commands.onSignOut([interaction] as never, { code: 123456 });

      expect(interaction.channel.send).not.toHaveBeenCalled();
    });

    it("replies with failure message on unsuccessful sign-out", async () => {
      const interaction = makeInteraction();
      service.signOut.mockReturnValue(
        okAsync({ success: false, message: "You are not signed in." })
      );

      await commands.onSignOut([interaction] as never, { code: 123456 });

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "You are not signed in.",
      });
    });

    it("passes code and guildId to attendanceService.signOut", async () => {
      const interaction = makeInteraction();
      service.signOut.mockReturnValue(okAsync({ success: true }));

      await commands.onSignOut([interaction] as never, { code: 111111 });

      expect(service.signOut).toHaveBeenCalledWith(
        "user-discord-id",
        "yeti-server-id",
        "Test User",
        111111
      );
    });
  });

  // ─── /admin-signin ────────────────────────────────────────────────────────

  describe("onAdminSignIn", () => {
    const targetUser = { id: "target-user-id" };

    it("rejects when caller lacks admin role", async () => {
      const interaction = makeInteraction({
        member: { roles: { cache: { has: vi.fn().mockReturnValue(false) } } },
      });

      await commands.onAdminSignIn([interaction] as never, { user: targetUser } as never);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "You do not have permission to use this command.",
      });
      expect(service.signIn).not.toHaveBeenCalled();
    });

    it("rejects when target user has no nickname", async () => {
      const interaction = makeInteraction({
        guild: {
          id: "yeti-server-id",
          members: { fetch: vi.fn().mockResolvedValue({ nickname: null }) },
        },
      });

      await commands.onAdminSignIn([interaction] as never, { user: targetUser } as never);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "User must have a nickname to sign in.",
      });
    });

    it("replies with unexpected error when signIn returns err", async () => {
      const interaction = makeInteraction();
      service.signIn.mockReturnValue(errAsync(new Error("sheet error")));

      await commands.onAdminSignIn([interaction] as never, { user: targetUser } as never);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "An unexpected error occurred.",
      });
    });

    it("announces to channel and confirms successful admin sign-in", async () => {
      const interaction = makeInteraction();
      service.signIn.mockReturnValue(okAsync({ success: true }));

      await commands.onAdminSignIn([interaction] as never, { user: targetUser } as never);

      expect(interaction.channel.send).toHaveBeenCalledWith(
        "<@target-user-id> has been signed in by an admin."
      );
      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "Successfully signed in Test User.",
      });
    });

    it("skips channel send when channel is not sendable", async () => {
      const interaction = makeInteraction({
        channel: {
          isSendable: vi.fn().mockReturnValue(false),
          send: vi.fn(),
        },
      });
      service.signIn.mockReturnValue(okAsync({ success: true }));

      await commands.onAdminSignIn([interaction] as never, { user: targetUser } as never);

      expect(interaction.channel.send).not.toHaveBeenCalled();
      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "Successfully signed in Test User.",
      });
    });

    it("replies with failure message on unsuccessful admin sign-in", async () => {
      const interaction = makeInteraction();
      service.signIn.mockReturnValue(okAsync({ success: false, message: "Already signed in." }));

      await commands.onAdminSignIn([interaction] as never, { user: targetUser } as never);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "Already signed in.",
      });
    });

    it("falls back to default failure message when no message provided", async () => {
      const interaction = makeInteraction();
      service.signIn.mockReturnValue(
        okAsync({ success: false, message: "Failed to sign in Test User." })
      );

      await commands.onAdminSignIn([interaction] as never, { user: targetUser } as never);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "Failed to sign in Test User.",
      });
    });

    it("calls signIn with skipTwofa=true and target user id", async () => {
      const interaction = makeInteraction();
      service.signIn.mockReturnValue(okAsync({ success: true }));

      await commands.onAdminSignIn([interaction] as never, { user: targetUser } as never);

      expect(service.signIn).toHaveBeenCalledWith(
        "target-user-id",
        "yeti-server-id",
        "Test User",
        undefined,
        true
      );
    });

    it("falls back to empty string guild id when guild has no id", async () => {
      const interaction = makeInteraction({
        guild: {
          id: undefined,
          members: { fetch: vi.fn().mockResolvedValue({ nickname: "Test User" }) },
        },
        member: { roles: { cache: { has: vi.fn().mockReturnValue(true) } } },
      });
      service.signIn.mockReturnValue(okAsync({ success: true }));

      await commands.onAdminSignIn([interaction] as never, { user: targetUser } as never);

      expect(service.signIn).toHaveBeenCalledWith(
        "target-user-id",
        "",
        "Test User",
        undefined,
        true
      );
    });
  });

  // ─── /admin-signout ───────────────────────────────────────────────────────

  describe("onAdminSignOut", () => {
    const targetUser = { id: "target-user-id" };

    it("rejects when caller lacks admin role", async () => {
      const interaction = makeInteraction({
        member: { roles: { cache: { has: vi.fn().mockReturnValue(false) } } },
      });

      await commands.onAdminSignOut([interaction] as never, { user: targetUser } as never);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "You do not have permission to use this command.",
      });
      expect(service.signOut).not.toHaveBeenCalled();
    });

    it("rejects when target user has no nickname", async () => {
      const interaction = makeInteraction({
        guild: {
          id: "yeti-server-id",
          members: { fetch: vi.fn().mockResolvedValue({ nickname: null }) },
        },
      });

      await commands.onAdminSignOut([interaction] as never, { user: targetUser } as never);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "User must have a nickname to sign out.",
      });
    });

    it("replies with unexpected error when signOut returns err", async () => {
      const interaction = makeInteraction();
      service.signOut.mockReturnValue(errAsync(new Error("sheet error")));

      await commands.onAdminSignOut([interaction] as never, { user: targetUser } as never);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "An unexpected error occurred.",
      });
    });

    it("announces to channel and confirms successful admin sign-out", async () => {
      const interaction = makeInteraction();
      service.signOut.mockReturnValue(okAsync({ success: true }));

      await commands.onAdminSignOut([interaction] as never, { user: targetUser } as never);

      expect(interaction.channel.send).toHaveBeenCalledWith(
        "<@target-user-id> has been signed out by an admin."
      );
      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "Successfully signed out Test User.",
      });
    });

    it("skips channel send when channel is not sendable", async () => {
      const interaction = makeInteraction({
        channel: {
          isSendable: vi.fn().mockReturnValue(false),
          send: vi.fn(),
        },
      });
      service.signOut.mockReturnValue(okAsync({ success: true }));

      await commands.onAdminSignOut([interaction] as never, { user: targetUser } as never);

      expect(interaction.channel.send).not.toHaveBeenCalled();
    });

    it("replies with failure message on unsuccessful admin sign-out", async () => {
      const interaction = makeInteraction();
      service.signOut.mockReturnValue(
        okAsync({ success: false, message: "User is not signed in." })
      );

      await commands.onAdminSignOut([interaction] as never, { user: targetUser } as never);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: "User is not signed in.",
      });
    });

    it("calls signOut with skipTwofa=true and target user id", async () => {
      const interaction = makeInteraction();
      service.signOut.mockReturnValue(okAsync({ success: true }));

      await commands.onAdminSignOut([interaction] as never, { user: targetUser } as never);

      expect(service.signOut).toHaveBeenCalledWith(
        "target-user-id",
        "yeti-server-id",
        "Test User",
        undefined,
        true
      );
    });
  });

  // ─── /attendance ──────────────────────────────────────────────────────────

  describe("onAttendance", () => {
    it("replies with error when getUserHours returns err", async () => {
      const interaction = makeInteraction();
      service.getUserHours.mockReturnValue(errAsync(new Error("sheet error")));
      service.getUserRank.mockReturnValue(okAsync(1));

      await commands.onAttendance([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        "There was an error getting your attendance. Please let a mentor know."
      );
    });

    it("replies with error when getUserRank returns err", async () => {
      const interaction = makeInteraction();
      service.getUserHours.mockReturnValue(okAsync(10));
      service.getUserRank.mockReturnValue(errAsync(new Error("sheet error")));

      await commands.onAttendance([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        "There was an error getting your attendance. Please let a mentor know."
      );
    });

    it("shows leadership message when above leadership threshold (85%)", async () => {
      const interaction = makeInteraction();
      // totalPossibleHours = 100 (mocked), 85% threshold = 85h
      service.getUserHours.mockReturnValue(okAsync(90));
      service.getUserRank.mockReturnValue(okAsync(1));

      await commands.onAttendance([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("above the minimum hours for leadership")
      );
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("1st overall"));
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining(":tada:"));
    });

    it("shows member message when above member threshold (75%) but below leadership (85%)", async () => {
      const interaction = makeInteraction();
      // 75-84h out of 100 = above member, below leadership
      service.getUserHours.mockReturnValue(okAsync(80));
      service.getUserRank.mockReturnValue(okAsync(2));

      await commands.onAttendance([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("above the minimum hours for members")
      );
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("2nd overall"));
    });

    it("shows behind-goal message when below member threshold (75%)", async () => {
      const interaction = makeInteraction();
      // 50h out of 100 = below 75% threshold
      service.getUserHours.mockReturnValue(okAsync(50));
      service.getUserRank.mockReturnValue(okAsync(5));

      await commands.onAttendance([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("behind the minimum hours goal")
      );
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("5th overall"));
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining(":rocket:"));
    });

    it("omits rank string when rank is null", async () => {
      const interaction = makeInteraction();
      service.getUserHours.mockReturnValue(okAsync(50));
      service.getUserRank.mockReturnValue(okAsync(null));

      await commands.onAttendance([interaction] as never);

      expect(interaction.reply).not.toHaveBeenCalledWith(expect.stringContaining("ranked"));
    });

    it("shows 0% when total possible hours is 0", async () => {
      const interaction = makeInteraction();
      service.getTotalPossibleHoursToDate.mockReturnValue(0);
      service.getUserHours.mockReturnValue(okAsync(0));
      service.getUserRank.mockReturnValue(okAsync(null));

      await commands.onAttendance([interaction] as never);

      // When totalPossibleHours is 0 the percentage branch shows "behind goal"
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("0%"));
    });
  });

  // ─── /attendance-leaderboard ──────────────────────────────────────────────

  describe("onAttendanceLeaderboard", () => {
    it("replies with 'no attendance data' when repository fails", async () => {
      const interaction = makeInteraction();
      service.getTopMembersByHours.mockReturnValue(errAsync(new Error("sheet error")));

      await commands.onAttendanceLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith("No attendance data found");
    });

    it("replies with 'no attendance data' when list is empty", async () => {
      const interaction = makeInteraction();
      service.getTopMembersByHours.mockReturnValue(okAsync([]));

      await commands.onAttendanceLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith("No attendance data found");
    });

    it("shows leaderboard with medal emojis for top 3 and numbers for 4th/5th", async () => {
      const interaction = makeInteraction();
      service.getTopMembersByHours.mockReturnValue(
        okAsync([
          { userName: "Alice", totalHours: 50 },
          { userName: "Bob", totalHours: 40 },
          { userName: "Carol", totalHours: 30 },
          { userName: "Dave", totalHours: 20 },
          { userName: "Eve", totalHours: 10 },
        ])
      );

      await commands.onAttendanceLeaderboard([interaction] as never);

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
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining("Updated in real-time from attendance records")
      );
    });

    it("shows leaderboard with a single entry", async () => {
      const interaction = makeInteraction();
      service.getTopMembersByHours.mockReturnValue(okAsync([{ userName: "Solo", totalHours: 99 }]));

      await commands.onAttendanceLeaderboard([interaction] as never);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.stringContaining(":first_place_medal:")
      );
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("Solo"));
      expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining("99 hours"));
    });

    it("calls getTopMembersByHours with limit 5", async () => {
      const interaction = makeInteraction();
      service.getTopMembersByHours.mockReturnValue(okAsync([]));

      await commands.onAttendanceLeaderboard([interaction] as never);

      expect(service.getTopMembersByHours).toHaveBeenCalledWith(5);
    });
  });
});
