import { Test, type TestingModule } from "@nestjs/testing";
import { ResultAsync } from "neverthrow";
import { AppConfigService } from "src/config/config.service";
import { SheetService } from "src/lib/sheet/sheet.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_RANGE } from "./attendance.constants";
import { AttendanceRepository } from "./attendance.repository";
import type { AttendanceRecord } from "./attendance.schema";

const { mockGet, mockAppend, mockConfigGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockAppend: vi.fn(),
  mockConfigGet: vi.fn(),
}));

/** Header row + data rows. Column order: discordId, team, discordName, date, isSigningIn */
function makeSheetRows(header: string[], ...dataRows: unknown[][]): unknown[][] {
  return [header, ...dataRows];
}

const HEADER = ["discordId", "team", "discordName", "date", "isSigningIn"];

describe("AttendanceRepository", () => {
  let repository: AttendanceRepository;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockConfigGet.mockReturnValue(undefined);
    mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve([HEADER])));
    mockAppend.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve()));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceRepository,
        {
          provide: SheetService,
          useValue: {
            get: mockGet,
            append: mockAppend,
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            get: mockConfigGet,
          },
        },
      ],
    }).compile();

    repository = module.get<AttendanceRepository>(AttendanceRepository);
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("findByDiscordId", () => {
    it("should return matching records for a given discord id", async () => {
      const discordId = "1234567890";
      const rows = makeSheetRows(
        HEADER,
        [discordId, "YETI Robotics", "user#1234", "2025-01-15", "true"],
        ["other-id", "Dev", "other#5678", "2025-01-16", "true"]
      );
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findByDiscordId(discordId);

      expect(result.isOk()).toBe(true);
      const records = result._unsafeUnwrap();
      expect(records).toHaveLength(1);
      const [record] = records;
      expect(record).toEqual({
        discordId,
        team: "YETI Robotics",
        discordName: "user#1234",
        date: "2025-01-15",
        isSigningIn: true,
      });
      expect(mockGet).toHaveBeenCalledWith(SHEET_RANGE);
    });

    it("should use ATTENDANCE_LOOKUP_DISCORD_ID override when configured", async () => {
      const overrideDiscordId = "864685448282636319";
      mockConfigGet.mockImplementation((key: string) =>
        key === "attendanceLookupDiscordId" ? overrideDiscordId : undefined
      );

      const rows = makeSheetRows(
        HEADER,
        [overrideDiscordId, "YETI Robotics", "user#1234", "2025-01-15", "true"],
        ["other-id", "Dev", "other#5678", "2025-01-16", "true"]
      );
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findByDiscordId("requested-id");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(1);
      expect(result._unsafeUnwrap()[0]?.discordId).toBe(overrideDiscordId);
    });

    it("should return multiple records when user has multiple entries", async () => {
      const discordId = "111";
      const rows = makeSheetRows(
        HEADER,
        [discordId, "YETI Robotics", "user", "2025-01-15", "true"],
        [discordId, "YETI Robotics", "user", "2025-01-16", "false"]
      );
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findByDiscordId(discordId);

      expect(result.isOk()).toBe(true);
      const records = result._unsafeUnwrap();
      expect(records).toHaveLength(2);
      const [first, second] = records;
      expect(first?.date).toBe("2025-01-15");
      expect(first?.isSigningIn).toBe(true);
      expect(second?.date).toBe("2025-01-16");
      expect(second?.isSigningIn).toBe(false);
    });

    it("should return empty array when no matching discord id", async () => {
      const rows = makeSheetRows(HEADER, [
        "other-id",
        "YETI Robotics",
        "other",
        "2025-01-15",
        "true",
      ]);
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findByDiscordId("nonexistent");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
    });

    it("should treat TRUE (uppercase) as isSigningIn true", async () => {
      const rows = makeSheetRows(HEADER, ["123", "YETI Robotics", "user", "2025-01-15", "TRUE"]);
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findByDiscordId("123");

      expect(result.isOk()).toBe(true);
      const [record] = result._unsafeUnwrap();
      expect(record?.isSigningIn).toBe(true);
    });

    it("should skip malformed rows and return valid ones", async () => {
      const discordId = "123";
      const rows = makeSheetRows(
        HEADER,
        [discordId, "YETI Robotics", "user", "2025-01-15", "true"],
        [discordId] // matches filter but missing required columns — triggers warn path
      );
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findByDiscordId(discordId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(1);
    });

    it("should propagate error when sheet.get fails", async () => {
      const err = new Error("Sheet API failed");
      mockGet.mockReturnValue(ResultAsync.fromPromise(Promise.reject(err), (e) => e as Error));

      const result = await repository.findByDiscordId("123");

      expect(result.isErr()).toBe(true);
    });
  });

  describe("findAll", () => {
    it("should return all records skipping header row", async () => {
      const rows = makeSheetRows(
        HEADER,
        ["1", "YETI Robotics", "user1", "2025-01-15", "true"],
        ["2", "Dev", "user2", "2025-01-16", "false"]
      );
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findAll();

      expect(result.isOk()).toBe(true);
      const records = result._unsafeUnwrap();
      expect(records).toHaveLength(2);
      const [first, second] = records;
      expect(first?.discordId).toBe("1");
      expect(second?.discordId).toBe("2");
      expect(mockGet).toHaveBeenCalledWith(SHEET_RANGE);
    });

    it("should return empty array when sheet has only header", async () => {
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve([HEADER])));

      const result = await repository.findAll();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
    });

    it("should skip malformed rows", async () => {
      const rows = makeSheetRows(
        HEADER,
        ["1", "YETI Robotics", "user", "2025-01-15", "true"],
        [null, undefined, "", "", ""], // invalid
        ["2", "Dev", "other", "2025-01-16", "false"]
      );
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findAll();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(2);
    });

    it("should skip rows with missing IS_SIGNING_IN column rather than treating them as sign-outs", async () => {
      const rows = makeSheetRows(
        HEADER,
        ["1", "YETI Robotics", "user", "2025-01-15", "true"],
        ["1", "YETI Robotics", "user", "2025-01-15"], // missing IS_SIGNING_IN — was the bug
        ["1", "YETI Robotics", "user", "2025-01-15", "false"]
      );
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findAll();

      expect(result.isOk()).toBe(true);
      const records = result._unsafeUnwrap();
      expect(records).toHaveLength(2);
      expect(records[0]?.isSigningIn).toBe(true);
      expect(records[1]?.isSigningIn).toBe(false);
    });

    it("should propagate error when sheet.get fails", async () => {
      const err = new Error("Sheet API failed");
      mockGet.mockReturnValue(ResultAsync.fromPromise(Promise.reject(err), (e) => e as Error));

      const result = await repository.findAll();

      expect(result.isErr()).toBe(true);
    });
  });

  describe("append", () => {
    it("should append record with correct column order", async () => {
      const record: AttendanceRecord = {
        discordId: "123",
        team: "YETI Robotics",
        discordName: "user#1234",
        date: "2025-01-15",
        isSigningIn: true,
      };

      const result = await repository.append(record);

      expect(result.isOk()).toBe(true);
      expect(mockAppend).toHaveBeenCalledWith(SHEET_RANGE, [
        ["123", "YETI Robotics", "user#1234", "2025-01-15", "true"],
      ]);
    });

    it("should serialize isSigningIn false as string", async () => {
      const record: AttendanceRecord = {
        discordId: "456",
        team: "Dev",
        discordName: "dev#5678",
        date: "2025-01-16",
        isSigningIn: false,
      };

      const result = await repository.append(record);

      expect(result.isOk()).toBe(true);
      expect(mockAppend).toHaveBeenCalledWith(SHEET_RANGE, [
        ["456", "Dev", "dev#5678", "2025-01-16", "false"],
      ]);
    });

    it("should propagate error when sheet.append fails", async () => {
      const err = new Error("Append failed");
      mockAppend.mockReturnValue(ResultAsync.fromPromise(Promise.reject(err), (e) => e as Error));

      const result = await repository.append({
        discordId: "123",
        team: "YETI Robotics",
        discordName: "user",
        date: "2025-01-15",
        isSigningIn: true,
      });

      expect(result.isErr()).toBe(true);
    });
  });
});
