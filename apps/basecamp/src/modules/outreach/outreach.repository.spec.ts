import { Test, type TestingModule } from "@nestjs/testing";
import { ResultAsync } from "neverthrow";
import { SheetService } from "src/lib/sheet/sheet.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OUTREACH_SHEET_RANGE } from "./outreach.constants";
import { OutreachRepository } from "./outreach.repository";
import { type OutreachRecord } from "./outreach.schema";

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

const HEADER = ["Date", "Name", "Event", "Type", "Hours"];

function makeSheetRows(...dataRows: unknown[][]): unknown[][] {
  return [HEADER, ...dataRows];
}

function makeRow(
  date: unknown,
  userName: unknown,
  event: unknown,
  eventType: unknown,
  hours: unknown
): unknown[] {
  return [date, userName, event, eventType, hours];
}

describe("OutreachRepository", () => {
  let repository: OutreachRepository;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve([HEADER])));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutreachRepository,
        {
          provide: SheetService,
          useValue: { get: mockGet },
        },
      ],
    }).compile();

    repository = module.get<OutreachRepository>(OutreachRepository);
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all parsed records skipping the header row", async () => {
      const rows = makeSheetRows(
        makeRow("2024-01-01", "John Doe", "Event 1", "Workshop", "10"),
        makeRow("2024-01-02", "Jane Smith", "Event 2", "Competition", "15.5")
      );
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findAll();

      expect(result.isOk()).toBe(true);
      const records = result._unsafeUnwrap();
      expect(records).toHaveLength(2);
      expect(records[0]).toEqual<OutreachRecord>({
        date: "2024-01-01",
        userName: "John Doe",
        event: "Event 1",
        eventType: "Workshop",
        hours: 10,
      });
      expect(records[1]).toEqual<OutreachRecord>({
        date: "2024-01-02",
        userName: "Jane Smith",
        event: "Event 2",
        eventType: "Competition",
        hours: 15.5,
      });
      expect(mockGet).toHaveBeenCalledWith(OUTREACH_SHEET_RANGE);
    });

    it("should return empty array when sheet has only a header row", async () => {
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve([HEADER])));

      const result = await repository.findAll();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
    });

    it("should return empty array when sheet is completely empty", async () => {
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve([])));

      const result = await repository.findAll();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
    });

    it("should skip malformed rows and return valid ones", async () => {
      const rows = makeSheetRows(
        makeRow("2024-01-01", "John Doe", "Event 1", "Workshop", "10"),
        makeRow(undefined, undefined, undefined, undefined, "bad"), // malformed — missing strings
        makeRow("2024-01-02", "Jane Smith", "Event 2", "Competition", "15")
      );
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findAll();

      expect(result.isOk()).toBe(true);
      const records = result._unsafeUnwrap();
      expect(records).toHaveLength(2);
      expect(records[0]?.userName).toBe("John Doe");
      expect(records[1]?.userName).toBe("Jane Smith");
    });

    it("should skip rows that are missing all columns", async () => {
      const rows = makeSheetRows([], []);
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findAll();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
    });

    it("should correctly parse hours as a number from a string value", async () => {
      const rows = makeSheetRows(makeRow("2024-01-01", "Alice", "Event", "Type", "42"));
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findAll();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()[0]?.hours).toBe(42);
    });

    it("should propagate error when sheet.get fails", async () => {
      const err = new Error("Sheet API failed");
      mockGet.mockReturnValue(ResultAsync.fromPromise(Promise.reject(err), (e) => e as Error));

      const result = await repository.findAll();

      expect(result.isErr()).toBe(true);
    });
  });

  describe("findByUserName", () => {
    it("should return records matching the given userName", async () => {
      const rows = makeSheetRows(
        makeRow("2024-01-01", "John Doe", "Event 1", "Workshop", "10"),
        makeRow("2024-01-02", "Jane Smith", "Event 2", "Competition", "15"),
        makeRow("2024-01-03", "John Doe", "Event 3", "Outreach", "5")
      );
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findByUserName("John Doe");

      expect(result.isOk()).toBe(true);
      const records = result._unsafeUnwrap();
      expect(records).toHaveLength(2);
      expect(records[0]).toEqual<OutreachRecord>({
        date: "2024-01-01",
        userName: "John Doe",
        event: "Event 1",
        eventType: "Workshop",
        hours: 10,
      });
      expect(records[1]).toEqual<OutreachRecord>({
        date: "2024-01-03",
        userName: "John Doe",
        event: "Event 3",
        eventType: "Outreach",
        hours: 5,
      });
    });

    it("should return empty array when no records match the given userName", async () => {
      const rows = makeSheetRows(makeRow("2024-01-01", "Jane Smith", "Event 1", "Workshop", "10"));
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findByUserName("NonExistentUser");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
    });

    it("should return empty array when sheet has only a header row", async () => {
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve([HEADER])));

      const result = await repository.findByUserName("John Doe");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
    });

    it("should not return records for a different user with a similar name", async () => {
      const rows = makeSheetRows(
        makeRow("2024-01-01", "John Doe", "Event 1", "Workshop", "10"),
        makeRow("2024-01-02", "John Doe Jr.", "Event 2", "Competition", "5")
      );
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findByUserName("John Doe");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(1);
      expect(result._unsafeUnwrap()[0]?.userName).toBe("John Doe");
    });

    it("should skip malformed rows and still return valid matching records", async () => {
      const rows = makeSheetRows(
        makeRow("2024-01-01", "John Doe", "Event 1", "Workshop", "10"),
        makeRow(undefined, undefined, undefined, undefined, "bad"), // malformed
        makeRow("2024-01-02", "John Doe", "Event 2", "Outreach", "8")
      );
      mockGet.mockReturnValue(ResultAsync.fromSafePromise(Promise.resolve(rows)));

      const result = await repository.findByUserName("John Doe");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(2);
    });

    it("should propagate error when sheet.get fails", async () => {
      const err = new Error("Sheet API failed");
      mockGet.mockReturnValue(ResultAsync.fromPromise(Promise.reject(err), (e) => e as Error));

      const result = await repository.findByUserName("John Doe");

      expect(result.isErr()).toBe(true);
    });
  });
});
