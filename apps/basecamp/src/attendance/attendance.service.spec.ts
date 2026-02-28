import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";
import { SheetService } from "../sheet/sheet.service";
import { EXPIRED_SESSION_THRESHOLD_MS, FORGOT_SIGNOUT_CREDIT_MS } from "./attendance.constants";
import { AttendanceService } from "./attendance.service";
import { TwofaService } from "./twofa/twofa.service";

const MS_PER_HOUR = 1000 * 60 * 60;

function makeRow(discordId: string, dateISO: string, isSigningIn: boolean): string[] {
  return [discordId, "YETI Robotics", "Test User 1", dateISO, String(isSigningIn)];
}

function successResult() {
  return { updates: { updatedRows: 1 } };
}

function failResult() {
  return { updates: { updatedRows: 0 } };
}

describe("AttendanceService", () => {
  let service: AttendanceService;
  let sheetService: {
    getSheetValues: MockedFunction<SheetService["getSheetValues"]>;
    appendSheetValues: MockedFunction<SheetService["appendSheetValues"]>;
  };

  const mockAttendanceData = [
    ["user1", "YETI Robotics", "Test User 1", "2025-01-01T10:00:00Z", "true"],
    ["user1", "YETI Robotics", "Test User 1", "2025-01-01T12:00:00Z", "false"],
    ["user2", "Dev", "Test User 2", "2025-01-02T10:00:00Z", "true"],
    ["user2", "Dev", "Test User 2", "2025-01-02T12:00:00Z", "false"],
    ["user1", "YETI Robotics", "Test User 1", "2025-01-03T10:00:00Z", "true"],
    ["user1", "YETI Robotics", "Test User 1", "2025-01-03T12:00:00Z", "false"],
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: SheetService,
          useValue: {
            getSheetValues: vi.fn(),
            appendSheetValues: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockImplementation((key: string) => {
              switch (key) {
                case "ATTENDANCE_SPREADSHEET_ID":
                  return "test-sheet-id";
                case "YETI_SERVER_ID":
                  return "yeti-server-id";
                case "DEV_GUILD_ID":
                  return "dev-guild-id";
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

    service = module.get<AttendanceService>(AttendanceService);
    sheetService = module.get(SheetService);
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
      sheetService.getSheetValues.mockResolvedValue([]);
      const result = await service.getAttendance("user1");

      expect(result).toEqual([]);
      expect(sheetService.getSheetValues).toHaveBeenCalledWith("test-sheet-id", "Attendance!A:E");
    });

    it("should return filtered attendance records for a specific user", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockAttendanceData);

      const result = await service.getAttendance("user1");

      expect(result).toHaveLength(4);
      expect(result.every((record) => record.discordId === "user1")).toBe(true);
      expect(result[0].isSigningIn).toBe(true);
      expect(result[1].isSigningIn).toBe(false);
      expect(result[2].isSigningIn).toBe(true);
      expect(result[3].isSigningIn).toBe(false);
    });

    it("should handle when user has no attendance records", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockAttendanceData);

      const result = await service.getAttendance("nonexistent-user");

      expect(result).toEqual([]);
    });
  });

  describe("getUserHours", () => {
    it("should calculate hours correctly for a user with attendance records", async () => {
      const mockUserAttendance = [
        ["user1", "YETI Robotics", "Test User 1", "2025-01-01T10:00:00Z", "true"],
        ["user1", "YETI Robotics", "Test User 1", "2025-01-01T12:30:00Z", "false"],
      ];
      sheetService.getSheetValues.mockResolvedValue(mockUserAttendance);

      const result = await service.getUserHours("user1");
      expect(result).toBeCloseTo(2.5);
    });

    it("should return 0 for a user with no attendance records", async () => {
      sheetService.getSheetValues.mockResolvedValue([]);
      const result = await service.getUserHours("nonexistent-user");
      expect(result).toBe(0);
    });
  });

  describe("signIn", () => {
    it("signs in successfully when no prior records", async () => {
      sheetService.getSheetValues.mockResolvedValue([]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      const result = await service.signIn("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({ success: true });
      expect(sheetService.appendSheetValues).toHaveBeenCalledTimes(1);
    });

    it("signs in successfully when last record is a sign-out", async () => {
      sheetService.getSheetValues.mockResolvedValue([
        makeRow("user1", "2025-01-01T10:00:00Z", true),
        makeRow("user1", "2025-01-01T12:00:00Z", false),
      ]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      const result = await service.signIn("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({ success: true });
    });

    it("returns 'You are currently signed in.' shortly after sign-in", async () => {
      const now = new Date("2025-01-01T12:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 1 * MS_PER_HOUR).toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);

      const result = await service.signIn("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({ success: false, message: "You are currently signed in." });
      expect(sheetService.appendSheetValues).not.toHaveBeenCalled();
    });

    it("returns 'You are currently signed in.' when signed in earlier the same Eastern day", async () => {
      // now = 2025-01-01T22:00:00 ET (03:00 UTC Jan 2), signIn = 2025-01-01T08:00:00 ET (13:00 UTC Jan 1)
      // Same Eastern calendar day, 14h gap — should NOT be stale
      const now = new Date("2025-01-02T03:00:00Z"); // 10pm ET Jan 1
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date("2025-01-01T13:00:00Z").toISOString(); // 8am ET Jan 1
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);

      const result = await service.signIn("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({ success: false, message: "You are currently signed in." });
    });

    it("auto-credits 1.5h and signs in when session is stale (different Eastern day, >6h)", async () => {
      // now = 2025-01-02T15:00:00Z (10am ET Jan 2), signIn = 2025-01-01T15:00:00Z (10am ET Jan 1)
      // Different Eastern calendar day, 24h gap — should be stale
      const now = new Date("2025-01-02T15:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date("2025-01-01T15:00:00Z").toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      const result = await service.signIn("user1", "yeti-server-id", "Test User 1");

      expect(result.success).toBe(true);
      expect(result.message).toContain("credited with 1.5 hours");
      // Two appends: sign-out at signIn+1.5h, then new sign-in at "now"
      expect(sheetService.appendSheetValues).toHaveBeenCalledTimes(2);

      // First call: sign-out with credited time
      const firstCallRow = sheetService.appendSheetValues.mock.calls[0][2][0];
      expect(firstCallRow[4]).toBe("false"); // isSigningIn = false (sign-out)
      const creditedDate = new Date(firstCallRow[3]);
      const originalSignIn = new Date(signInTime);
      expect(creditedDate.getTime()).toBe(originalSignIn.getTime() + FORGOT_SIGNOUT_CREDIT_MS);

      // Second call: new sign-in at "now"
      const secondCallRow = sheetService.appendSheetValues.mock.calls[1][2][0];
      expect(secondCallRow[4]).toBe("true"); // isSigningIn = true
    });

    it("returns failure when auto sign-out append fails (stale cross-day session)", async () => {
      const now = new Date("2025-01-02T15:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date("2025-01-01T15:00:00Z").toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      sheetService.appendSheetValues.mockResolvedValue(failResult());

      const result = await service.signIn("user1", "yeti-server-id", "Test User 1");

      expect(result.success).toBe(false);
    });

    it("returns failure when new sign-in append fails after successful auto sign-out (stale cross-day session)", async () => {
      const now = new Date("2025-01-02T15:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date("2025-01-01T15:00:00Z").toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      sheetService.appendSheetValues
        .mockResolvedValueOnce(successResult())
        .mockResolvedValueOnce(failResult());

      const result = await service.signIn("user1", "yeti-server-id", "Test User 1");

      expect(result.success).toBe(false);
    });

    it("returns failure message when append returns 0 updated rows", async () => {
      sheetService.getSheetValues.mockResolvedValue([]);
      sheetService.appendSheetValues.mockResolvedValue(failResult());

      const result = await service.signIn("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({
        success: false,
        message: "Failed to sign in. Please try again or let a mentor know.",
      });
    });

    it("returns failure message when append throws", async () => {
      sheetService.getSheetValues.mockResolvedValue([]);
      sheetService.appendSheetValues.mockRejectedValue(new Error("Sheet API error"));

      const result = await service.signIn("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({
        success: false,
        message: "Failed to sign in. Please try again or let a mentor know.",
      });
    });

    it("maps YETI guild to 'YETI Robotics'", async () => {
      sheetService.getSheetValues.mockResolvedValue([]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      await service.signIn("user1", "yeti-server-id", "Test User 1");

      const row = sheetService.appendSheetValues.mock.calls[0][2][0];
      expect(row[1]).toBe("YETI Robotics");
    });

    it("maps Dev guild to 'Dev'", async () => {
      sheetService.getSheetValues.mockResolvedValue([]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      await service.signIn("user1", "dev-guild-id", "Test User 1");

      const row = sheetService.appendSheetValues.mock.calls[0][2][0];
      expect(row[1]).toBe("Dev");
    });

    it("maps unknown guild to empty string", async () => {
      sheetService.getSheetValues.mockResolvedValue([]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      await service.signIn("user1", "unknown-guild-id", "Test User 1");

      const row = sheetService.appendSheetValues.mock.calls[0][2][0];
      expect(row[1]).toBe("");
    });
  });

  describe("signOut", () => {
    it("returns 'You are not signed in.' when no records", async () => {
      sheetService.getSheetValues.mockResolvedValue([]);

      const result = await service.signOut("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({ success: false, message: "You are not signed in." });
    });

    it("returns 'You are not signed in.' when last record is sign-out", async () => {
      sheetService.getSheetValues.mockResolvedValue([
        makeRow("user1", "2025-01-01T10:00:00Z", true),
        makeRow("user1", "2025-01-01T12:00:00Z", false),
      ]);

      const result = await service.signOut("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({ success: false, message: "You are not signed in." });
    });

    it("signs out successfully after a 2h session", async () => {
      const now = new Date("2025-01-01T12:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 2 * MS_PER_HOUR).toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      const result = await service.signOut("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({ success: true });
      expect(sheetService.appendSheetValues).toHaveBeenCalledTimes(1);
    });

    it("signs out at exactly the expired threshold (boundary)", async () => {
      const now = new Date("2025-01-02T04:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Exactly 18h — uses > not >=, so should still sign out normally
      const signInTime = new Date(now.getTime() - EXPIRED_SESSION_THRESHOLD_MS).toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      const result = await service.signOut("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({ success: true });
    });

    it("expired session on a different Eastern day gets 1.5h credit", async () => {
      // now = 2025-01-02T15:00:00Z (10am ET Jan 2), signIn = 2025-01-01T15:00:00Z (10am ET Jan 1)
      // Different Eastern day (>18h ago) → signOut redirects to signIn → isStaleSession=true → 1.5h credit
      const now = new Date("2025-01-02T15:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date("2025-01-01T15:00:00Z").toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      const result = await service.signOut("user1", "yeti-server-id", "Test User 1");

      // Redirects to signIn → handleForgotToSignOut → 1.5h credit
      expect(result.success).toBe(true);
      expect(result.message).toContain("credited with 1.5 hours");
    });

    it("regular user at 19h gets 1.5h credit, NOT full 19h (anti-gaming)", async () => {
      const now = new Date("2025-01-02T05:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 19 * MS_PER_HOUR).toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      const result = await service.signOut("user1", "yeti-server-id", "Test User 1");

      expect(result.success).toBe(true);
      expect(result.message).toContain("credited with 1.5 hours");

      // Verify sign-out was recorded at signIn+1.5h, NOT at "now" (19h later)
      const firstCallRow = sheetService.appendSheetValues.mock.calls[0][2][0];
      expect(firstCallRow[4]).toBe("false"); // sign-out
      const creditedDate = new Date(firstCallRow[3]);
      const originalSignIn = new Date(signInTime);
      expect(creditedDate.getTime()).toBe(originalSignIn.getTime() + FORGOT_SIGNOUT_CREDIT_MS);
    });

    it("15h overnight session signs out normally (below threshold)", async () => {
      const now = new Date("2025-01-02T09:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 15 * MS_PER_HOUR).toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      const result = await service.signOut("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({ success: true });
    });

    it("admin signOut at 19h bypasses expired check and records full hours", async () => {
      const now = new Date("2025-01-02T05:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 19 * MS_PER_HOUR).toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      const result = await service.signOut(
        "user1",
        "yeti-server-id",
        "Test User 1",
        undefined,
        true // skipTwofa = admin
      );

      expect(result).toEqual({ success: true });
      // Only one append: the sign-out itself (no redirect to signIn)
      expect(sheetService.appendSheetValues).toHaveBeenCalledTimes(1);
      const row = sheetService.appendSheetValues.mock.calls[0][2][0];
      expect(row[4]).toBe("false"); // sign-out record
    });

    it("admin signOut at 25h bypasses expired check and records full hours", async () => {
      const now = new Date("2025-01-02T11:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 25 * MS_PER_HOUR).toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      sheetService.appendSheetValues.mockResolvedValue(successResult());

      const result = await service.signOut(
        "user1",
        "yeti-server-id",
        "Test User 1",
        undefined,
        true // skipTwofa = admin
      );

      expect(result).toEqual({ success: true });
      expect(sheetService.appendSheetValues).toHaveBeenCalledTimes(1);
    });

    it("returns failure message when append returns 0 updated rows", async () => {
      const now = new Date("2025-01-01T12:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 2 * MS_PER_HOUR).toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      sheetService.appendSheetValues.mockResolvedValue(failResult());

      const result = await service.signOut("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({
        success: false,
        message: "Failed to sign out. Please try again or let a mentor know.",
      });
    });

    it("returns failure message when append throws", async () => {
      const now = new Date("2025-01-01T12:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const signInTime = new Date(now.getTime() - 2 * MS_PER_HOUR).toISOString();
      sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      sheetService.appendSheetValues.mockRejectedValue(new Error("Sheet API error"));

      const result = await service.signOut("user1", "yeti-server-id", "Test User 1");

      expect(result).toEqual({
        success: false,
        message: "Failed to sign out. Please try again or let a mentor know.",
      });
    });
  });

  describe("with 2FA enabled", () => {
    let twofaService: { verifyCode: MockedFunction<TwofaService["verifyCode"]> };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AttendanceService,
          {
            provide: SheetService,
            useValue: {
              getSheetValues: vi.fn(),
              appendSheetValues: vi.fn(),
            },
          },
          {
            provide: ConfigService,
            useValue: {
              get: vi.fn().mockImplementation((key: string, defaultValue?: unknown) => {
                switch (key) {
                  case "ATTENDANCE_SPREADSHEET_ID":
                    return "test-sheet-id";
                  case "YETI_SERVER_ID":
                    return "yeti-server-id";
                  case "DEV_GUILD_ID":
                    return "dev-guild-id";
                  case "ATTENDANCE_2FA_ENABLED":
                    return true;
                  default:
                    return defaultValue ?? null;
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

      service = module.get<AttendanceService>(AttendanceService);
      sheetService = module.get(SheetService);
      twofaService = module.get(TwofaService);
    });

    describe("signIn 2FA", () => {
      it("succeeds with valid code", async () => {
        sheetService.getSheetValues.mockResolvedValue([]);
        sheetService.appendSheetValues.mockResolvedValue(successResult());

        const result = await service.signIn("user1", "yeti-server-id", "Test User 1", 123456);

        expect(result).toEqual({ success: true });
        expect(twofaService.verifyCode).toHaveBeenCalledWith(123456);
      });

      it("rejects when no code provided", async () => {
        const result = await service.signIn("user1", "yeti-server-id", "Test User 1");

        expect(result).toEqual({
          success: false,
          message: "A code is required to sign in/out.",
        });
      });

      it("rejects with invalid code", async () => {
        twofaService.verifyCode.mockReturnValue(false);

        const result = await service.signIn("user1", "yeti-server-id", "Test User 1", 999999);

        expect(result).toEqual({ success: false, message: "Invalid code." });
      });

      it("bypasses 2FA when skipTwofa=true", async () => {
        sheetService.getSheetValues.mockResolvedValue([]);
        sheetService.appendSheetValues.mockResolvedValue(successResult());

        const result = await service.signIn(
          "user1",
          "yeti-server-id",
          "Test User 1",
          undefined,
          true
        );

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
        sheetService.getSheetValues.mockResolvedValue([makeRow("user1", signInTime, true)]);
      });

      it("succeeds with valid code", async () => {
        sheetService.appendSheetValues.mockResolvedValue(successResult());

        const result = await service.signOut("user1", "yeti-server-id", "Test User 1", 123456);

        expect(result).toEqual({ success: true });
        expect(twofaService.verifyCode).toHaveBeenCalledWith(123456);
      });

      it("rejects when no code provided", async () => {
        const result = await service.signOut("user1", "yeti-server-id", "Test User 1");

        expect(result).toEqual({
          success: false,
          message: "A code is required to sign in/out.",
        });
      });

      it("rejects with invalid code", async () => {
        twofaService.verifyCode.mockReturnValue(false);

        const result = await service.signOut("user1", "yeti-server-id", "Test User 1", 999999);

        expect(result).toEqual({ success: false, message: "Invalid code." });
      });

      it("bypasses 2FA when skipTwofa=true", async () => {
        sheetService.appendSheetValues.mockResolvedValue(successResult());

        const result = await service.signOut(
          "user1",
          "yeti-server-id",
          "Test User 1",
          undefined,
          true
        );

        expect(result).toEqual({ success: true });
        expect(twofaService.verifyCode).not.toHaveBeenCalled();
      });
    });
  });

  describe("getTopMembersByHours", () => {
    let mockGetSheetValues: MockedFunction<SheetService["getSheetValues"]>;

    beforeEach(() => {
      mockGetSheetValues = sheetService.getSheetValues;

      vi.spyOn(service, "getUserHours").mockImplementation(async (discordId) => {
        const hoursMap: Record<string, number> = {
          user1: 2,
          user2: 3,
          user3: 5,
        };
        return Promise.resolve(hoursMap[discordId] || 0);
      });
    });

    it("should return empty array when no attendance data", async () => {
      mockGetSheetValues.mockResolvedValue([
        ["discordId", "team", "discordName", "date", "isSigningIn"],
      ]);
      const result = await service.getTopMembersByHours(5);
      expect(result).toEqual([]);
    });

    it("should handle API errors by returning an empty array", async () => {
      mockGetSheetValues.mockRejectedValue(new Error("API Error"));
      const result = await service.getTopMembersByHours(5);
      expect(result).toEqual([]);
    });

    const mockAllAttendance = [
      ["discordId", "team", "discordName", "date", "isSigningIn"],
      ["user1", "YETI Robotics", "Test User 1", "2025-01-01T10:00:00Z", "true"],
      ["user1", "YETI Robotics", "Test User 1", "2025-01-01T12:00:00Z", "false"],
      ["user2", "YETI Robotics", "Test User 2", "2025-01-01T10:00:00Z", "true"],
      ["user2", "YETI Robotics", "Test User 2", "2025-01-01T13:00:00Z", "false"],
      ["user3", "YETI Robotics", "Test User 3", "2025-01-01T10:00:00Z", "true"],
      ["user3", "YETI Robotics", "Test User 3", "2025-01-01T15:00:00Z", "false"],
    ];

    it("should return top members sorted by hours in descending order", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockAllAttendance);

      const result = await service.getTopMembersByHours(2); // Get top 2

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        userName: "Test User 3",
        totalHours: 5,
      });
      expect(result[1]).toEqual({
        userName: "Test User 2",
        totalHours: 3,
      });
    });

    it("should return all members when limit is greater than number of users", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockAllAttendance);

      const result = await service.getTopMembersByHours(10);

      expect(result).toHaveLength(3);
      expect(result[0].totalHours).toBe(5);
      expect(result[1].totalHours).toBe(3);
      expect(result[2].totalHours).toBe(2);
    });

    it("should return empty array when no attendance data exists", async () => {
      sheetService.getSheetValues.mockResolvedValue([
        ["discordId", "team", "discordName", "date", "isSigningIn"],
      ]);

      const result = await service.getTopMembersByHours(5);
      expect(result).toEqual([]);
    });

    it("should handle errors gracefully and return empty array", async () => {
      vi.clearAllMocks();
      sheetService.getSheetValues.mockRejectedValue(new Error("API Error"));

      const result = await service.getTopMembersByHours(5);
      expect(result).toEqual([]);
    });

    it("should return default limit of 5 when no limit is specified", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockAllAttendance);

      const result = await service.getTopMembersByHours();

      expect(result).toHaveLength(3);
      expect(result[0].totalHours).toBe(5);
      expect(result[1].totalHours).toBe(3);
      expect(result[2].totalHours).toBe(2);
    });
  });

  describe("getUserRank", () => {
    const mockAllAttendance = [
      ["discordId", "team", "discordName", "date", "isSigningIn"],
      ["user1", "YETI Robotics", "Test User 1", "2025-01-01T10:00:00Z", "true"],
      ["user1", "YETI Robotics", "Test User 1", "2025-01-01T12:00:00Z", "false"],
      ["user2", "YETI Robotics", "Test User 2", "2025-01-01T10:00:00Z", "true"],
      ["user2", "YETI Robotics", "Test User 2", "2025-01-01T13:00:00Z", "false"],
      ["user3", "YETI Robotics", "Test User 3", "2025-01-01T10:00:00Z", "true"],
      ["user3", "YETI Robotics", "Test User 3", "2025-01-01T15:00:00Z", "false"],
    ];

    it("returns 1 for the user with the most hours", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockAllAttendance);
      expect(await service.getUserRank("user3")).toBe(1);
    });

    it("returns the correct rank for a mid-range user", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockAllAttendance);
      expect(await service.getUserRank("user2")).toBe(2);
    });

    it("returns the last rank for the user with fewest hours", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockAllAttendance);
      expect(await service.getUserRank("user1")).toBe(3);
    });

    it("returns null for a user not present in the sheet", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockAllAttendance);
      expect(await service.getUserRank("unknown")).toBeNull();
    });

    it("returns null when the sheet has only a header row", async () => {
      sheetService.getSheetValues.mockResolvedValue([
        ["discordId", "team", "discordName", "date", "isSigningIn"],
      ]);
      expect(await service.getUserRank("user1")).toBeNull();
    });

    it("returns null on API error", async () => {
      sheetService.getSheetValues.mockRejectedValue(new Error("API Error"));
      expect(await service.getUserRank("user1")).toBeNull();
    });

    describe("handles ties with dense ranking", () => {
      const tiedMockData = [
        ["discordId", "team", "discordName", "date", "isSigningIn"],
        ["joe", "YETI Robotics", "Joe", "2025-01-01T10:00:00Z", "true"],
        ["joe", "YETI Robotics", "Joe", "2025-01-01T15:00:00Z", "false"],
        ["jim", "YETI Robotics", "Jim", "2025-01-01T10:00:00Z", "true"],
        ["jim", "YETI Robotics", "Jim", "2025-01-01T14:00:00Z", "false"],
        ["sally", "YETI Robotics", "Sally", "2025-01-01T10:00:00Z", "true"],
        ["sally", "YETI Robotics", "Sally", "2025-01-01T13:00:00Z", "false"],
        ["kyle", "YETI Robotics", "Kyle", "2025-01-01T10:00:00Z", "true"],
        ["kyle", "YETI Robotics", "Kyle", "2025-01-01T13:00:00Z", "false"],
        ["marvin", "YETI Robotics", "Marvin", "2025-01-01T10:00:00Z", "true"],
        ["marvin", "YETI Robotics", "Marvin", "2025-01-01T13:00:00Z", "false"],
        ["baxter", "YETI Robotics", "Baxter", "2025-01-01T10:00:00Z", "true"],
        ["baxter", "YETI Robotics", "Baxter", "2025-01-01T12:00:00Z", "false"],
      ];

      beforeEach(() => {
        sheetService.getSheetValues.mockResolvedValue(tiedMockData);
      });

      it("returns rank 1 for the user with the most hours", async () => {
        expect(await service.getUserRank("joe")).toBe(1);
      });

      it("returns rank 2 for the second-place user", async () => {
        expect(await service.getUserRank("jim")).toBe(2);
      });

      it("returns rank 3 for the first tied user", async () => {
        expect(await service.getUserRank("sally")).toBe(3);
      });

      it("returns rank 3 for a mid tied user", async () => {
        expect(await service.getUserRank("kyle")).toBe(3);
      });

      it("returns rank 3 for the last tied user", async () => {
        expect(await service.getUserRank("marvin")).toBe(3);
      });

      it("returns rank 4 (not 6) for the user after the tied group", async () => {
        expect(await service.getUserRank("baxter")).toBe(4);
      });
    });
  });

  it("should handle users with same total hours correctly", async () => {
    const tiedData = [
      ["discordId", "team", "discordName", "date", "isSigningIn"],
      ["user1", "YETI", "User A", "2025-01-01T10:00:00Z", "true"],
      ["user1", "YETI", "User A", "2025-01-01T12:00:00Z", "false"],
      ["user2", "YETI", "User B", "2025-01-01T10:00:00Z", "true"],
      ["user2", "YETI", "User B", "2025-01-01T12:00:00Z", "false"],
    ];

    sheetService.getSheetValues.mockResolvedValue(tiedData);
    vi.spyOn(service, "getUserHours").mockImplementation(() => {
      return Promise.resolve(2);
    });

    const result = await service.getTopMembersByHours(2);

    expect(result).toHaveLength(2);
    expect(result[0].totalHours).toBe(2);
    expect(result[1].totalHours).toBe(2);
  });

  it("should handle null sheet data", async () => {
    sheetService.getSheetValues.mockResolvedValue(null);

    const result = await service.getTopMembersByHours(5);
    expect(result).toEqual([]);
  });

  it("should correctly sum hours for users with multiple attendance sessions", async () => {
    const multipleSessions = [
      ["discordId", "team", "discordName", "date", "isSigningIn"],
      ["user1", "YETI", "Test User", "2025-01-01T10:00:00Z", "true"],
      ["user1", "YETI", "Test User", "2025-01-01T12:00:00Z", "false"],
      ["user1", "YETI", "Test User", "2025-01-02T10:00:00Z", "true"],
      ["user1", "YETI", "Test User", "2025-01-02T14:00:00Z", "false"],
    ];

    sheetService.getSheetValues.mockResolvedValue(multipleSessions);
    vi.spyOn(service, "getUserHours").mockResolvedValue(6);

    const result = await service.getTopMembersByHours(5);

    expect(result).toHaveLength(1);
    expect(result[0].totalHours).toBe(6);
  });
});
