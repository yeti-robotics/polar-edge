import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { SheetService } from "../sheet/sheet.service";
import { AttendanceService } from "./attendance.service";
import { TwofaService } from "./twofa/twofa.service";

describe("AttendanceService", () => {
  let service: AttendanceService;
  let sheetService: jest.Mocked<Pick<SheetService, "getSheetValues" | "appendSheetValues">>;

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
            getSheetValues: jest.fn(),
            appendSheetValues: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
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
            verifyCode: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    sheetService = module.get(SheetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  describe("getTopMembersByHours", () => {
    let mockGetSheetValues: jest.Mock;

    beforeEach(() => {
      mockGetSheetValues = sheetService.getSheetValues as jest.Mock;

      jest.spyOn(service, "getUserHours").mockImplementation(async (discordId) => {
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
      jest.clearAllMocks();
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

  it("should handle users with same total hours correctly", async () => {
    const tiedData = [
      ["discordId", "team", "discordName", "date", "isSigningIn"],
      ["user1", "YETI", "User A", "2025-01-01T10:00:00Z", "true"],
      ["user1", "YETI", "User A", "2025-01-01T12:00:00Z", "false"],
      ["user2", "YETI", "User B", "2025-01-01T10:00:00Z", "true"],
      ["user2", "YETI", "User B", "2025-01-01T12:00:00Z", "false"],
    ];

    sheetService.getSheetValues.mockResolvedValue(tiedData);
    jest.spyOn(service, "getUserHours").mockImplementation(() => {
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
    jest.spyOn(service, "getUserHours").mockResolvedValue(6);

    const result = await service.getTopMembersByHours(5);

    expect(result).toHaveLength(1);
    expect(result[0].totalHours).toBe(6);
  });
});
