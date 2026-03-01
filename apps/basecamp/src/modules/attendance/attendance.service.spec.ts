import { Test, type TestingModule } from "@nestjs/testing";
import { errAsync, okAsync } from "neverthrow";
import { AppConfigService } from "src/config/config.service";
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";
import { EXPIRED_SESSION_THRESHOLD_MS, FORGOT_SIGNOUT_CREDIT_MS } from "./attendance.constants";
import { AttendanceRepository } from "./attendance.repository";
import { type AttendanceRecord } from "./attendance.schema";
import { AttendanceService } from "./attendance.service";
import { TwofaService } from "./twofa/twofa.service";

const MS_PER_HOUR = 1000 * 60 * 60;

function makeRecord(discordId: string, dateISO: string, isSigningIn: boolean): AttendanceRecord {
  return {
    discordId,
    team: "YETI Robotics",
    discordName: "Test User 1",
    date: dateISO,
    isSigningIn,
  };
}

function makeModule(attendance2faEnabled = false) {
  return Test.createTestingModule({
    providers: [
      AttendanceService,
      {
        provide: AttendanceRepository,
        useValue: {
          findByDiscordId: vi.fn(),
          findAll: vi.fn(),
          append: vi.fn(),
        },
      },
      {
        provide: AppConfigService,
        useValue: {
          get: vi.fn().mockImplementation((key: string) => {
            switch (key) {
              case "yetiServerId":
                return "yeti-server-id";
              case "devGuildId":
                return "dev-guild-id";
              case "attendance2faEnabled":
                return attendance2faEnabled;
              default:
                return null;
            }
          }),
        },
      },
      {
        provide: TwofaService,
        useValue: {
          verifyCode: vi.fn().mockReturnValue(true),
        },
      },
    ],
  }).compile();
}

describe("AttendanceService", () => {
  let service: AttendanceService;
  let repository: {
    findByDiscordId: MockedFunction<AttendanceRepository["findByDiscordId"]>;
    findAll: MockedFunction<AttendanceRepository["findAll"]>;
    append: MockedFunction<AttendanceRepository["append"]>;
  };

  const mockAttendanceRecords: AttendanceRecord[] = [
    {
      discordId: "user1",
      team: "YETI Robotics",
      discordName: "Test User 1",
      date: "2025-01-01T10:00:00Z",
      isSigningIn: true,
    },
    {
      discordId: "user1",
      team: "YETI Robotics",
      discordName: "Test User 1",
      date: "2025-01-01T12:00:00Z",
      isSigningIn: false,
    },
    {
      discordId: "user2",
      team: "Dev",
      discordName: "Test User 2",
      date: "2025-01-02T10:00:00Z",
      isSigningIn: true,
    },
    {
      discordId: "user2",
      team: "Dev",
      discordName: "Test User 2",
      date: "2025-01-02T12:00:00Z",
      isSigningIn: false,
    },
    {
      discordId: "user1",
      team: "YETI Robotics",
      discordName: "Test User 1",
      date: "2025-01-03T10:00:00Z",
      isSigningIn: true,
    },
    {
      discordId: "user1",
      team: "YETI Robotics",
      discordName: "Test User 1",
      date: "2025-01-03T12:00:00Z",
      isSigningIn: false,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await makeModule();
    service = module.get<AttendanceService>(AttendanceService);
    repository = module.get(AttendanceRepository);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAttendance", () => {
    it("should return empty array when no attendance records exist", async () => {
      repository.findByDiscordId.mockReturnValue(okAsync([]));
      const result = (await service.getAttendance("user1"))._unsafeUnwrap();
      expect(result).toEqual([]);
    });

    it("should return attendance records for a specific user", async () => {
      const user1Records = mockAttendanceRecords.filter((r) => r.discordId === "user1");
      repository.findByDiscordId.mockReturnValue(okAsync(user1Records));

      const result = (await service.getAttendance("user1"))._unsafeUnwrap();

      expect(result).toHaveLength(4);
      expect(result.every((record) => record.discordId === "user1")).toBe(true);
      expect(result[0]?.isSigningIn).toBe(true);
      expect(result[1]?.isSigningIn).toBe(false);
      expect(result[2]?.isSigningIn).toBe(true);
      expect(result[3]?.isSigningIn).toBe(false);
    });

    it("should return empty array when user has no records", async () => {
      repository.findByDiscordId.mockReturnValue(okAsync([]));
      const result = (await service.getAttendance("nonexistent-user"))._unsafeUnwrap();
      expect(result).toEqual([]);
    });
  });

  describe("getUserHours", () => {
    it("should calculate hours correctly for a user with attendance records", async () => {
      repository.findByDiscordId.mockReturnValue(
        okAsync([
          {
            discordId: "user1",
            team: "YETI Robotics",
            discordName: "Test User 1",
            date: "2025-01-01T10:00:00Z",
            isSigningIn: true,
          },
          {
            discordId: "user1",
            team: "YETI Robotics",
            discordName: "Test User 1",
            date: "2025-01-01T12:30:00Z",
            isSigningIn: false,
          },
        ])
      );

      const result = (await service.getUserHours("user1"))._unsafeUnwrap();
      expect(result).toBeCloseTo(2.5);
    });

    it("should return 0 for a user with no attendance records", async () => {
      repository.findByDiscordId.mockReturnValue(okAsync([]));
      const result = (await service.getUserHours("nonexistent-user"))._unsafeUnwrap();
      expect(result).toBe(0);
    });
  });

  describe("signIn", () => {
    it("signs in successfully when no prior records", async () => {
      repository.findByDiscordId.mockReturnValue(okAsync([]));
      repository.append.mockReturnValue(okAsync(undefined));

      const result = (
        await service.signIn("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result).toEqual({ success: true });
      expect(repository.append).toHaveBeenCalledTimes(1);
    });

    it("signs in successfully when last record is a sign-out", async () => {
      repository.findByDiscordId.mockReturnValue(
        okAsync([
          makeRecord("user1", "2025-01-01T10:00:00Z", true),
          makeRecord("user1", "2025-01-01T12:00:00Z", false),
        ])
      );
      repository.append.mockReturnValue(okAsync(undefined));

      const result = (
        await service.signIn("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result).toEqual({ success: true });
    });

    it("returns 'You are currently signed in.' shortly after sign-in", async () => {
      const now = new Date("2025-01-01T12:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 1 * MS_PER_HOUR).toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));

      const result = (
        await service.signIn("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result).toEqual({ success: false, message: "You are currently signed in." });
      expect(repository.append).not.toHaveBeenCalled();
    });

    it("returns 'You are currently signed in.' when signed in earlier the same Eastern day", async () => {
      // now = 2025-01-01T22:00:00 ET (03:00 UTC Jan 2), signIn = 2025-01-01T08:00:00 ET (13:00 UTC Jan 1)
      // Same Eastern calendar day, 14h gap — should NOT be stale
      const now = new Date("2025-01-02T03:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date("2025-01-01T13:00:00Z").toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));

      const result = (
        await service.signIn("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result).toEqual({ success: false, message: "You are currently signed in." });
    });

    it("auto-credits 1.5h and signs in when session is stale (different Eastern day, >6h)", async () => {
      // now = 2025-01-02T15:00:00Z (10am ET Jan 2), signIn = 2025-01-01T15:00:00Z (10am ET Jan 1)
      const now = new Date("2025-01-02T15:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date("2025-01-01T15:00:00Z").toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));
      repository.append.mockReturnValue(okAsync(undefined));

      const result = (
        await service.signIn("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result.success).toBe(true);
      expect(result.message).toContain("credited with 1.5 hours");
      expect(repository.append).toHaveBeenCalledTimes(2);

      const firstRecord = repository.append.mock.calls.at(0)?.[0] as AttendanceRecord;
      expect(firstRecord.isSigningIn).toBe(false);
      const creditedDate = new Date(firstRecord.date);
      const originalSignIn = new Date(signInTime);
      expect(creditedDate.getTime()).toBe(originalSignIn.getTime() + FORGOT_SIGNOUT_CREDIT_MS);

      const secondRecord = repository.append.mock.calls.at(1)?.[0] as AttendanceRecord;
      expect(secondRecord.isSigningIn).toBe(true);
    });

    it("returns failure when auto sign-out append fails (stale cross-day session)", async () => {
      const now = new Date("2025-01-02T15:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date("2025-01-01T15:00:00Z").toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));
      repository.append.mockReturnValue(errAsync(new Error("append failed")));

      const result = (
        await service.signIn("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result.success).toBe(false);
    });

    it("returns failure when new sign-in append fails after successful auto sign-out (stale cross-day session)", async () => {
      const now = new Date("2025-01-02T15:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date("2025-01-01T15:00:00Z").toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));
      repository.append
        .mockReturnValueOnce(okAsync(undefined))
        .mockReturnValueOnce(errAsync(new Error("append failed")));

      const result = (
        await service.signIn("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result.success).toBe(false);
    });

    it("returns failure message when append fails", async () => {
      repository.findByDiscordId.mockReturnValue(okAsync([]));
      repository.append.mockReturnValue(errAsync(new Error("append failed")));

      const result = (
        await service.signIn("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result).toEqual({
        success: false,
        message: "Failed to sign in. Please try again or let a mentor know.",
      });
    });

    it("propagates error when Intl.DateTimeFormat returns malformed parts", async () => {
      const signInTime = new Date("2025-01-01T15:00:00Z").toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));

      const spy = vi.spyOn(Intl.DateTimeFormat.prototype, "formatToParts").mockReturnValue([]);

      const result = await service.signIn("user1", "yeti-server-id", "Test User 1");

      spy.mockRestore();
      expect(result.isErr()).toBe(true);
    });

    it("maps YETI guild to 'YETI Robotics'", async () => {
      repository.findByDiscordId.mockReturnValue(okAsync([]));
      repository.append.mockReturnValue(okAsync(undefined));

      await service.signIn("user1", "yeti-server-id", "Test User 1");

      const record = repository.append.mock.calls.at(0)?.[0] as AttendanceRecord;
      expect(record.team).toBe("YETI Robotics");
    });

    it("maps Dev guild to 'Dev'", async () => {
      repository.findByDiscordId.mockReturnValue(okAsync([]));
      repository.append.mockReturnValue(okAsync(undefined));

      await service.signIn("user1", "dev-guild-id", "Test User 1");

      const record = repository.append.mock.calls.at(0)?.[0] as AttendanceRecord;
      expect(record.team).toBe("Dev");
    });

    it("maps unknown guild to empty string", async () => {
      repository.findByDiscordId.mockReturnValue(okAsync([]));
      repository.append.mockReturnValue(okAsync(undefined));

      await service.signIn("user1", "unknown-guild-id", "Test User 1");

      const record = repository.append.mock.calls.at(0)?.[0] as AttendanceRecord;
      expect(record.team).toBe("");
    });
  });

  describe("signOut", () => {
    it("returns 'You are not signed in.' when no records", async () => {
      repository.findByDiscordId.mockReturnValue(okAsync([]));

      const result = (
        await service.signOut("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result).toEqual({ success: false, message: "You are not signed in." });
    });

    it("returns 'You are not signed in.' when last record is sign-out", async () => {
      repository.findByDiscordId.mockReturnValue(
        okAsync([
          makeRecord("user1", "2025-01-01T10:00:00Z", true),
          makeRecord("user1", "2025-01-01T12:00:00Z", false),
        ])
      );

      const result = (
        await service.signOut("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result).toEqual({ success: false, message: "You are not signed in." });
    });

    it("signs out successfully after a 2h session", async () => {
      const now = new Date("2025-01-01T12:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 2 * MS_PER_HOUR).toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));
      repository.append.mockReturnValue(okAsync(undefined));

      const result = (
        await service.signOut("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result).toEqual({ success: true });
      expect(repository.append).toHaveBeenCalledTimes(1);
    });

    it("signs out at exactly the expired threshold (boundary)", async () => {
      const now = new Date("2025-01-02T04:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Exactly 18h — uses > not >=, so should still sign out normally
      const signInTime = new Date(now.getTime() - EXPIRED_SESSION_THRESHOLD_MS).toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));
      repository.append.mockReturnValue(okAsync(undefined));

      const result = (
        await service.signOut("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result).toEqual({ success: true });
    });

    it("expired session on a different Eastern day gets 1.5h credit", async () => {
      // now = 2025-01-02T15:00:00Z (10am ET Jan 2), signIn = 2025-01-01T15:00:00Z (10am ET Jan 1)
      const now = new Date("2025-01-02T15:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date("2025-01-01T15:00:00Z").toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));
      repository.append.mockReturnValue(okAsync(undefined));

      const result = (
        await service.signOut("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result.success).toBe(true);
      expect(result.message).toContain("credited with 1.5 hours");
    });

    it("regular user at 19h gets 1.5h credit, NOT full 19h (anti-gaming)", async () => {
      const now = new Date("2025-01-02T05:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 19 * MS_PER_HOUR).toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));
      repository.append.mockReturnValue(okAsync(undefined));

      const result = (
        await service.signOut("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result.success).toBe(true);
      expect(result.message).toContain("credited with 1.5 hours");

      const firstRecord = repository.append.mock.calls.at(0)?.[0] as AttendanceRecord;
      expect(firstRecord.isSigningIn).toBe(false);
      const creditedDate = new Date(firstRecord.date);
      const originalSignIn = new Date(signInTime);
      expect(creditedDate.getTime()).toBe(originalSignIn.getTime() + FORGOT_SIGNOUT_CREDIT_MS);
    });

    it("15h overnight session signs out normally (below threshold)", async () => {
      const now = new Date("2025-01-02T09:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 15 * MS_PER_HOUR).toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));
      repository.append.mockReturnValue(okAsync(undefined));

      const result = (
        await service.signOut("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result).toEqual({ success: true });
    });

    it("admin signOut at 19h bypasses expired check and records full hours", async () => {
      const now = new Date("2025-01-02T05:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 19 * MS_PER_HOUR).toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));
      repository.append.mockReturnValue(okAsync(undefined));

      const result = (
        await service.signOut("user1", "yeti-server-id", "Test User 1", undefined, true)
      )._unsafeUnwrap();

      expect(result).toEqual({ success: true });
      expect(repository.append).toHaveBeenCalledTimes(1);
      const record = repository.append.mock.calls.at(0)?.[0] as AttendanceRecord;
      expect(record.isSigningIn).toBe(false);
    });

    it("admin signOut at 25h bypasses expired check and records full hours", async () => {
      const now = new Date("2025-01-02T11:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 25 * MS_PER_HOUR).toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));
      repository.append.mockReturnValue(okAsync(undefined));

      const result = (
        await service.signOut("user1", "yeti-server-id", "Test User 1", undefined, true)
      )._unsafeUnwrap();

      expect(result).toEqual({ success: true });
      expect(repository.append).toHaveBeenCalledTimes(1);
    });

    it("returns failure message when append fails", async () => {
      const now = new Date("2025-01-01T12:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 2 * MS_PER_HOUR).toISOString();
      repository.findByDiscordId.mockReturnValue(okAsync([makeRecord("user1", signInTime, true)]));
      repository.append.mockReturnValue(errAsync(new Error("append failed")));

      const result = (
        await service.signOut("user1", "yeti-server-id", "Test User 1")
      )._unsafeUnwrap();

      expect(result).toEqual({
        success: false,
        message: "Failed to sign out. Please try again or let a mentor know.",
      });
    });
  });

  describe("with 2FA enabled", () => {
    let twofaService: { verifyCode: MockedFunction<TwofaService["verifyCode"]> };

    beforeEach(async () => {
      const module: TestingModule = await makeModule(true);
      service = module.get<AttendanceService>(AttendanceService);
      repository = module.get(AttendanceRepository);
      twofaService = module.get(TwofaService);
    });

    describe("signIn 2FA", () => {
      it("succeeds with valid code", async () => {
        repository.findByDiscordId.mockReturnValue(okAsync([]));
        repository.append.mockReturnValue(okAsync(undefined));

        const result = (
          await service.signIn("user1", "yeti-server-id", "Test User 1", 123456)
        )._unsafeUnwrap();

        expect(result).toEqual({ success: true });
        expect(twofaService.verifyCode).toHaveBeenCalledWith(123456);
      });

      it("rejects when no code provided", async () => {
        const result = (
          await service.signIn("user1", "yeti-server-id", "Test User 1")
        )._unsafeUnwrap();

        expect(result).toEqual({
          success: false,
          message: "A code is required to sign in/out.",
        });
      });

      it("rejects with invalid code", async () => {
        twofaService.verifyCode.mockReturnValue(false);

        const result = (
          await service.signIn("user1", "yeti-server-id", "Test User 1", 999999)
        )._unsafeUnwrap();

        expect(result).toEqual({ success: false, message: "Invalid code." });
      });

      it("bypasses 2FA when skipTwofa=true", async () => {
        repository.findByDiscordId.mockReturnValue(okAsync([]));
        repository.append.mockReturnValue(okAsync(undefined));

        const result = (
          await service.signIn("user1", "yeti-server-id", "Test User 1", undefined, true)
        )._unsafeUnwrap();

        expect(result).toEqual({ success: true });
        expect(twofaService.verifyCode).not.toHaveBeenCalled();
      });
    });

    describe("signOut 2FA", () => {
      beforeEach(() => {
        const now = new Date("2025-01-01T12:00:00Z");
        vi.useFakeTimers();
        vi.setSystemTime(now);

        const signInTime = new Date(now.getTime() - 2 * MS_PER_HOUR).toISOString();
        repository.findByDiscordId.mockReturnValue(
          okAsync([makeRecord("user1", signInTime, true)])
        );
      });

      it("succeeds with valid code", async () => {
        repository.append.mockReturnValue(okAsync(undefined));

        const result = (
          await service.signOut("user1", "yeti-server-id", "Test User 1", 123456)
        )._unsafeUnwrap();

        expect(result).toEqual({ success: true });
        expect(twofaService.verifyCode).toHaveBeenCalledWith(123456);
      });

      it("rejects when no code provided", async () => {
        const result = (
          await service.signOut("user1", "yeti-server-id", "Test User 1")
        )._unsafeUnwrap();

        expect(result).toEqual({
          success: false,
          message: "A code is required to sign in/out.",
        });
      });

      it("rejects with invalid code", async () => {
        twofaService.verifyCode.mockReturnValue(false);

        const result = (
          await service.signOut("user1", "yeti-server-id", "Test User 1", 999999)
        )._unsafeUnwrap();

        expect(result).toEqual({ success: false, message: "Invalid code." });
      });

      it("bypasses 2FA when skipTwofa=true", async () => {
        repository.append.mockReturnValue(okAsync(undefined));

        const result = (
          await service.signOut("user1", "yeti-server-id", "Test User 1", undefined, true)
        )._unsafeUnwrap();

        expect(result).toEqual({ success: true });
        expect(twofaService.verifyCode).not.toHaveBeenCalled();
      });
    });
  });

  describe("getTopMembersByHours", () => {
    const mockAllRecords: AttendanceRecord[] = [
      {
        discordId: "user1",
        team: "YETI Robotics",
        discordName: "Test User 1",
        date: "2025-01-01T10:00:00Z",
        isSigningIn: true,
      },
      {
        discordId: "user1",
        team: "YETI Robotics",
        discordName: "Test User 1",
        date: "2025-01-01T12:00:00Z",
        isSigningIn: false,
      },
      {
        discordId: "user2",
        team: "YETI Robotics",
        discordName: "Test User 2",
        date: "2025-01-01T10:00:00Z",
        isSigningIn: true,
      },
      {
        discordId: "user2",
        team: "YETI Robotics",
        discordName: "Test User 2",
        date: "2025-01-01T13:00:00Z",
        isSigningIn: false,
      },
      {
        discordId: "user3",
        team: "YETI Robotics",
        discordName: "Test User 3",
        date: "2025-01-01T10:00:00Z",
        isSigningIn: true,
      },
      {
        discordId: "user3",
        team: "YETI Robotics",
        discordName: "Test User 3",
        date: "2025-01-01T15:00:00Z",
        isSigningIn: false,
      },
    ];
    // user1: 2h, user2: 3h, user3: 5h

    it("should return empty array when no attendance data", async () => {
      repository.findAll.mockReturnValue(okAsync([]));
      const result = (await service.getTopMembersByHours(5))._unsafeUnwrap();
      expect(result).toEqual([]);
    });

    it("propagates error when repository fails", async () => {
      repository.findAll.mockReturnValue(errAsync(new Error("API Error")));
      const result = await service.getTopMembersByHours(5);
      expect(result.isErr()).toBe(true);
    });

    it("should return top members sorted by hours in descending order", async () => {
      repository.findAll.mockReturnValue(okAsync(mockAllRecords));

      const result = (await service.getTopMembersByHours(2))._unsafeUnwrap();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ userName: "Test User 3", totalHours: 5 });
      expect(result[1]).toEqual({ userName: "Test User 2", totalHours: 3 });
    });

    it("should return all members when limit is greater than number of users", async () => {
      repository.findAll.mockReturnValue(okAsync(mockAllRecords));

      const result = (await service.getTopMembersByHours(10))._unsafeUnwrap();

      expect(result).toHaveLength(3);
      expect(result.at(0)?.totalHours).toBe(5);
      expect(result.at(1)?.totalHours).toBe(3);
      expect(result.at(2)?.totalHours).toBe(2);
    });

    it("should return default limit of 5 when no limit is specified", async () => {
      repository.findAll.mockReturnValue(okAsync(mockAllRecords));

      const result = (await service.getTopMembersByHours())._unsafeUnwrap();

      expect(result).toHaveLength(3);
      expect(result.at(0)?.totalHours).toBe(5);
    });

    it("should correctly sum hours for users with multiple sessions", async () => {
      const multiSession: AttendanceRecord[] = [
        {
          discordId: "user1",
          team: "YETI",
          discordName: "Test User",
          date: "2025-01-01T10:00:00Z",
          isSigningIn: true,
        },
        {
          discordId: "user1",
          team: "YETI",
          discordName: "Test User",
          date: "2025-01-01T12:00:00Z",
          isSigningIn: false,
        },
        {
          discordId: "user1",
          team: "YETI",
          discordName: "Test User",
          date: "2025-01-02T10:00:00Z",
          isSigningIn: true,
        },
        {
          discordId: "user1",
          team: "YETI",
          discordName: "Test User",
          date: "2025-01-02T14:00:00Z",
          isSigningIn: false,
        },
      ];
      repository.findAll.mockReturnValue(okAsync(multiSession));

      const result = (await service.getTopMembersByHours(5))._unsafeUnwrap();

      expect(result).toHaveLength(1);
      expect(result.at(0)?.totalHours).toBe(6);
    });

    it("should handle users with same total hours correctly", async () => {
      const tiedData: AttendanceRecord[] = [
        {
          discordId: "user1",
          team: "YETI",
          discordName: "User A",
          date: "2025-01-01T10:00:00Z",
          isSigningIn: true,
        },
        {
          discordId: "user1",
          team: "YETI",
          discordName: "User A",
          date: "2025-01-01T12:00:00Z",
          isSigningIn: false,
        },
        {
          discordId: "user2",
          team: "YETI",
          discordName: "User B",
          date: "2025-01-01T10:00:00Z",
          isSigningIn: true,
        },
        {
          discordId: "user2",
          team: "YETI",
          discordName: "User B",
          date: "2025-01-01T12:00:00Z",
          isSigningIn: false,
        },
      ];
      repository.findAll.mockReturnValue(okAsync(tiedData));

      const result = (await service.getTopMembersByHours(2))._unsafeUnwrap();

      expect(result).toHaveLength(2);
      expect(result.at(0)?.totalHours).toBe(2);
      expect(result.at(1)?.totalHours).toBe(2);
    });
  });

  describe("getUserRank", () => {
    const mockAllRecords: AttendanceRecord[] = [
      {
        discordId: "user1",
        team: "YETI Robotics",
        discordName: "Test User 1",
        date: "2025-01-01T10:00:00Z",
        isSigningIn: true,
      },
      {
        discordId: "user1",
        team: "YETI Robotics",
        discordName: "Test User 1",
        date: "2025-01-01T12:00:00Z",
        isSigningIn: false,
      },
      {
        discordId: "user2",
        team: "YETI Robotics",
        discordName: "Test User 2",
        date: "2025-01-01T10:00:00Z",
        isSigningIn: true,
      },
      {
        discordId: "user2",
        team: "YETI Robotics",
        discordName: "Test User 2",
        date: "2025-01-01T13:00:00Z",
        isSigningIn: false,
      },
      {
        discordId: "user3",
        team: "YETI Robotics",
        discordName: "Test User 3",
        date: "2025-01-01T10:00:00Z",
        isSigningIn: true,
      },
      {
        discordId: "user3",
        team: "YETI Robotics",
        discordName: "Test User 3",
        date: "2025-01-01T15:00:00Z",
        isSigningIn: false,
      },
    ];
    // user1: 2h, user2: 3h, user3: 5h

    it("returns 1 for the user with the most hours", async () => {
      repository.findAll.mockReturnValue(okAsync(mockAllRecords));
      expect((await service.getUserRank("user3"))._unsafeUnwrap()).toBe(1);
    });

    it("returns the correct rank for a mid-range user", async () => {
      repository.findAll.mockReturnValue(okAsync(mockAllRecords));
      expect((await service.getUserRank("user2"))._unsafeUnwrap()).toBe(2);
    });

    it("returns the last rank for the user with fewest hours", async () => {
      repository.findAll.mockReturnValue(okAsync(mockAllRecords));
      expect((await service.getUserRank("user1"))._unsafeUnwrap()).toBe(3);
    });

    it("returns null for a user not present", async () => {
      repository.findAll.mockReturnValue(okAsync(mockAllRecords));
      expect((await service.getUserRank("unknown"))._unsafeUnwrap()).toBeNull();
    });

    it("returns null when no records exist", async () => {
      repository.findAll.mockReturnValue(okAsync([]));
      expect((await service.getUserRank("user1"))._unsafeUnwrap()).toBeNull();
    });

    it("propagates error when repository fails", async () => {
      repository.findAll.mockReturnValue(errAsync(new Error("API Error")));
      const result = await service.getUserRank("user1");
      expect(result.isErr()).toBe(true);
    });

    describe("handles ties with dense ranking", () => {
      const tiedMockRecords: AttendanceRecord[] = [
        {
          discordId: "joe",
          team: "YETI Robotics",
          discordName: "Joe",
          date: "2025-01-01T10:00:00Z",
          isSigningIn: true,
        },
        {
          discordId: "joe",
          team: "YETI Robotics",
          discordName: "Joe",
          date: "2025-01-01T15:00:00Z",
          isSigningIn: false,
        },
        {
          discordId: "jim",
          team: "YETI Robotics",
          discordName: "Jim",
          date: "2025-01-01T10:00:00Z",
          isSigningIn: true,
        },
        {
          discordId: "jim",
          team: "YETI Robotics",
          discordName: "Jim",
          date: "2025-01-01T14:00:00Z",
          isSigningIn: false,
        },
        {
          discordId: "sally",
          team: "YETI Robotics",
          discordName: "Sally",
          date: "2025-01-01T10:00:00Z",
          isSigningIn: true,
        },
        {
          discordId: "sally",
          team: "YETI Robotics",
          discordName: "Sally",
          date: "2025-01-01T13:00:00Z",
          isSigningIn: false,
        },
        {
          discordId: "kyle",
          team: "YETI Robotics",
          discordName: "Kyle",
          date: "2025-01-01T10:00:00Z",
          isSigningIn: true,
        },
        {
          discordId: "kyle",
          team: "YETI Robotics",
          discordName: "Kyle",
          date: "2025-01-01T13:00:00Z",
          isSigningIn: false,
        },
        {
          discordId: "marvin",
          team: "YETI Robotics",
          discordName: "Marvin",
          date: "2025-01-01T10:00:00Z",
          isSigningIn: true,
        },
        {
          discordId: "marvin",
          team: "YETI Robotics",
          discordName: "Marvin",
          date: "2025-01-01T13:00:00Z",
          isSigningIn: false,
        },
        {
          discordId: "baxter",
          team: "YETI Robotics",
          discordName: "Baxter",
          date: "2025-01-01T10:00:00Z",
          isSigningIn: true,
        },
        {
          discordId: "baxter",
          team: "YETI Robotics",
          discordName: "Baxter",
          date: "2025-01-01T12:00:00Z",
          isSigningIn: false,
        },
      ];
      // joe: 5h, jim: 4h, sally/kyle/marvin: 3h each, baxter: 2h

      beforeEach(() => {
        repository.findAll.mockReturnValue(okAsync(tiedMockRecords));
      });

      it("returns rank 1 for the user with the most hours", async () => {
        expect((await service.getUserRank("joe"))._unsafeUnwrap()).toBe(1);
      });

      it("returns rank 2 for the second-place user", async () => {
        expect((await service.getUserRank("jim"))._unsafeUnwrap()).toBe(2);
      });

      it("returns rank 3 for the first tied user", async () => {
        expect((await service.getUserRank("sally"))._unsafeUnwrap()).toBe(3);
      });

      it("returns rank 3 for a mid tied user", async () => {
        expect((await service.getUserRank("kyle"))._unsafeUnwrap()).toBe(3);
      });

      it("returns rank 3 for the last tied user", async () => {
        expect((await service.getUserRank("marvin"))._unsafeUnwrap()).toBe(3);
      });

      it("returns rank 4 (not 6) for the user after the tied group", async () => {
        expect((await service.getUserRank("baxter"))._unsafeUnwrap()).toBe(4);
      });
    });
  });
});
