import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { SheetService } from "../sheet/sheet.service";
import { OutreachService } from "./outreach.service";

describe("OutreachService", () => {
  let service: OutreachService;
  let sheetService: jest.Mocked<SheetService>;

  const mockSheetData = [
    ["Date", "Name", "Event", "Type", "Hours"],
    ["2024-01-01", "John Doe", "Event 1", "Workshop", "10"],
    ["2024-01-02", "Jane Smith", "Event 2", "Competition", "15"],
    ["2024-01-03", "John Doe", "Event 3", "Workshop", "5"],
    ["2024-01-04", "Bob Johnson", "Event 4", "Outreach", "20"],
    ["2024-01-05", "Jane Smith", "Event 5", "Workshop", "8"],
    ["2024-01-06", "Alice Brown", "Event 6", "Competition", "12"],
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutreachService,
        {
          provide: SheetService,
          useValue: {
            getSheetValues: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue("1234567890"),
          },
        },
      ],
    }).compile();

    service = module.get<OutreachService>(OutreachService);
    sheetService = module.get(SheetService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getUserOutreach", () => {
    it("should return user outreach data when valid data exists", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockSheetData);

      const result = await service.getUserOutreach("John Doe");

      expect(result).toEqual([
        {
          date: "2024-01-01",
          userName: "John Doe",
          event: "Event 1",
          eventType: "Workshop",
          hours: 10,
        },
        {
          date: "2024-01-03",
          userName: "John Doe",
          event: "Event 3",
          eventType: "Workshop",
          hours: 5,
        },
      ]);
    });

    it("should return null when no data exists", async () => {
      sheetService.getSheetValues.mockResolvedValue(null);

      const result = await service.getUserOutreach("John Doe");

      expect(result).toBeNull();
    });

    it("should return null when user has no outreach", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockSheetData);

      const result = await service.getUserOutreach("NonExistentUser");

      expect(result).toEqual([]);
    });
  });

  describe("getTopMembersByHours", () => {
    let mockGetSheetValues: jest.Mock;

    beforeEach(() => {
      mockGetSheetValues = jest.fn();
      (sheetService.getSheetValues as jest.MockedFunction<typeof sheetService.getSheetValues>) =
        mockGetSheetValues;
    });

    it("should return empty array when no outreach data", async () => {
      mockGetSheetValues.mockResolvedValue([["Date", "Name", "Event", "Type", "Hours"]]);
      const result = await service.getTopMembersByHours(5);
      expect(result).toEqual([]);
    });

    it("should handle API errors and return empty array", async () => {
      mockGetSheetValues.mockRejectedValue(new Error("API Error"));
      const result = await service.getTopMembersByHours(5);
      expect(result).toEqual([]);
    });

    it("should return top 5 members sorted by total hours in descending order", async () => {
      mockGetSheetValues.mockResolvedValue(mockSheetData);
      const result = await service.getTopMembersByHours(5);

      expect(result).toEqual([
        { userName: "Jane Smith", totalHours: 23 },
        { userName: "Bob Johnson", totalHours: 20 },
        { userName: "John Doe", totalHours: 15 },
        { userName: "Alice Brown", totalHours: 12 },
      ]);
    });

    it("should return top 3 members when limit is 3", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockSheetData);

      const result = await service.getTopMembersByHours(3);

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { userName: "Jane Smith", totalHours: 23 },
        { userName: "Bob Johnson", totalHours: 20 },
        { userName: "John Doe", totalHours: 15 },
      ]);
    });

    it("should return empty array when no data exists", async () => {
      sheetService.getSheetValues.mockResolvedValue(null);

      const result = await service.getTopMembersByHours(5);

      expect(result).toEqual([]);
    });

    it("should return empty array when sheet data is empty", async () => {
      sheetService.getSheetValues.mockResolvedValue([]);

      const result = await service.getTopMembersByHours(5);

      expect(result).toEqual([]);
    });

    it("should handle single user with multiple entries correctly", async () => {
      const singleUserData = [
        ["Date", "Name", "Event", "Type", "Hours"],
        ["2024-01-01", "John Doe", "Event 1", "Workshop", "10"],
        ["2024-01-02", "John Doe", "Event 2", "Competition", "15"],
        ["2024-01-03", "John Doe", "Event 3", "Workshop", "5"],
      ];

      sheetService.getSheetValues.mockResolvedValue(singleUserData);

      const result = await service.getTopMembersByHours(5);

      expect(result).toEqual([{ userName: "John Doe", totalHours: 30 }]);
    });

    it("should handle users with same total hours correctly", async () => {
      const tiedData = [
        ["Date", "Name", "Event", "Type", "Hours"],
        ["2024-01-01", "User A", "Event 1", "Workshop", "10"],
        ["2024-01-02", "User B", "Event 2", "Competition", "10"],
        ["2024-01-03", "User C", "Event 3", "Workshop", "10"],
      ];

      sheetService.getSheetValues.mockResolvedValue(tiedData);

      const result = await service.getTopMembersByHours(3);

      expect(result).toHaveLength(3);
      expect(result.every((entry) => entry.totalHours === 10)).toBe(true);
    });

    it("should return default limit of 5 when no limit is specified", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockSheetData);

      const result = await service.getTopMembersByHours();

      expect(result).toHaveLength(4); // Only 4 unique users in mock data
      expect(result).toEqual([
        { userName: "Jane Smith", totalHours: 23 },
        { userName: "Bob Johnson", totalHours: 20 },
        { userName: "John Doe", totalHours: 15 },
        { userName: "Alice Brown", totalHours: 12 },
      ]);
    });

    it("should handle error gracefully and return empty array", async () => {
      sheetService.getSheetValues.mockRejectedValue(new Error("Sheet API error"));

      const result = await service.getTopMembersByHours(5);

      expect(result).toEqual([]);
    });

    it("should correctly sum hours for users with multiple entries", async () => {
      const multipleEntriesData = [
        ["Date", "Name", "Event", "Type", "Hours"],
        ["2024-01-01", "John Doe", "Event 1", "Workshop", "5"],
        ["2024-01-02", "John Doe", "Event 2", "Competition", "10"],
        ["2024-01-03", "John Doe", "Event 3", "Workshop", "15"],
        ["2024-01-04", "Jane Smith", "Event 4", "Outreach", "8"],
        ["2024-01-05", "Jane Smith", "Event 5", "Workshop", "12"],
      ];

      sheetService.getSheetValues.mockResolvedValue(multipleEntriesData);

      const result = await service.getTopMembersByHours(5);

      expect(result).toEqual([
        { userName: "John Doe", totalHours: 30 },
        { userName: "Jane Smith", totalHours: 20 },
      ]);
    });
  });

  describe("getTotalTeamOutreachHours", () => {
    it("should return total hours across all team members", async () => {
      sheetService.getSheetValues.mockResolvedValue(mockSheetData);

      const result = await service.getTotalTeamOutreachHours();

      // John Doe: 10 + 5 = 15, Jane Smith: 15 + 8 = 23, Bob Johnson: 20, Alice Brown: 12
      // Total: 15 + 23 + 20 + 12 = 70
      expect(result).toBe(70);
    });

    it("should return 0 when no data exists", async () => {
      sheetService.getSheetValues.mockResolvedValue(null);

      const result = await service.getTotalTeamOutreachHours();

      expect(result).toBe(0);
    });

    it("should return 0 when sheet data is empty", async () => {
      sheetService.getSheetValues.mockResolvedValue([]);

      const result = await service.getTotalTeamOutreachHours();

      expect(result).toBe(0);
    });

    it("should return 0 when sheet has only headers", async () => {
      sheetService.getSheetValues.mockResolvedValue([["Date", "Name", "Event", "Type", "Hours"]]);

      const result = await service.getTotalTeamOutreachHours();

      expect(result).toBe(0);
    });

    it("should handle API errors and return 0", async () => {
      sheetService.getSheetValues.mockRejectedValue(new Error("Sheet API error"));

      const result = await service.getTotalTeamOutreachHours();

      expect(result).toBe(0);
    });
  });
});
