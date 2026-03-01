import { Test, type TestingModule } from "@nestjs/testing";
import { errAsync, okAsync } from "neverthrow";
import { beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";
import { type OutreachRecord, OutreachRepository } from "./outreach.repository";
import { OutreachService } from "./outreach.service";

describe("OutreachService", () => {
  let service: OutreachService;
  let repository: {
    findAll: MockedFunction<OutreachRepository["findAll"]>;
    findByUserName: MockedFunction<OutreachRepository["findByUserName"]>;
  };

  const mockRecords: OutreachRecord[] = [
    { date: "2024-01-01", userName: "John Doe", event: "Event 1", eventType: "Workshop", hours: 10 },
    { date: "2024-01-02", userName: "Jane Smith", event: "Event 2", eventType: "Competition", hours: 15 },
    { date: "2024-01-03", userName: "John Doe", event: "Event 3", eventType: "Workshop", hours: 5 },
    { date: "2024-01-04", userName: "Bob Johnson", event: "Event 4", eventType: "Outreach", hours: 20 },
    { date: "2024-01-05", userName: "Jane Smith", event: "Event 5", eventType: "Workshop", hours: 8 },
    { date: "2024-01-06", userName: "Alice Brown", event: "Event 6", eventType: "Competition", hours: 12 },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutreachService,
        {
          provide: OutreachRepository,
          useValue: {
            findAll: vi.fn(),
            findByUserName: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OutreachService>(OutreachService);
    repository = module.get(OutreachRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getUserOutreach", () => {
    it("should return user outreach data when valid data exists", async () => {
      const johnRecords = mockRecords.filter((r) => r.userName === "John Doe");
      repository.findByUserName.mockReturnValue(okAsync(johnRecords));

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

    it("should return null when fetch fails", async () => {
      repository.findByUserName.mockReturnValue(errAsync(new Error("Sheet API error")));

      const result = await service.getUserOutreach("John Doe");

      expect(result).toBeNull();
    });

    it("should return empty array when user has no outreach", async () => {
      repository.findByUserName.mockReturnValue(okAsync([]));

      const result = await service.getUserOutreach("NonExistentUser");

      expect(result).toEqual([]);
    });
  });

  describe("getTopMembersByHours", () => {
    it("should return empty array when no outreach data", async () => {
      repository.findAll.mockReturnValue(okAsync([]));
      const result = await service.getTopMembersByHours(5);
      expect(result).toEqual([]);
    });

    it("should handle fetch errors and return empty array", async () => {
      repository.findAll.mockReturnValue(errAsync(new Error("API Error")));
      const result = await service.getTopMembersByHours(5);
      expect(result).toEqual([]);
    });

    it("should return top 5 members sorted by total hours in descending order", async () => {
      repository.findAll.mockReturnValue(okAsync(mockRecords));
      const result = await service.getTopMembersByHours(5);

      expect(result).toEqual([
        { userName: "Jane Smith", totalHours: 23 },
        { userName: "Bob Johnson", totalHours: 20 },
        { userName: "John Doe", totalHours: 15 },
        { userName: "Alice Brown", totalHours: 12 },
      ]);
    });

    it("should return top 3 members when limit is 3", async () => {
      repository.findAll.mockReturnValue(okAsync(mockRecords));

      const result = await service.getTopMembersByHours(3);

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { userName: "Jane Smith", totalHours: 23 },
        { userName: "Bob Johnson", totalHours: 20 },
        { userName: "John Doe", totalHours: 15 },
      ]);
    });

    it("should return empty array when sheet data is empty", async () => {
      repository.findAll.mockReturnValue(okAsync([]));
      const result = await service.getTopMembersByHours(5);
      expect(result).toEqual([]);
    });

    it("should handle single user with multiple entries correctly", async () => {
      const singleUserData: OutreachRecord[] = [
        { date: "2024-01-01", userName: "John Doe", event: "Event 1", eventType: "Workshop", hours: 10 },
        { date: "2024-01-02", userName: "John Doe", event: "Event 2", eventType: "Competition", hours: 15 },
        { date: "2024-01-03", userName: "John Doe", event: "Event 3", eventType: "Workshop", hours: 5 },
      ];
      repository.findAll.mockReturnValue(okAsync(singleUserData));

      const result = await service.getTopMembersByHours(5);

      expect(result).toEqual([{ userName: "John Doe", totalHours: 30 }]);
    });

    it("should handle users with same total hours correctly", async () => {
      const tiedData: OutreachRecord[] = [
        { date: "2024-01-01", userName: "User A", event: "Event 1", eventType: "Workshop", hours: 10 },
        { date: "2024-01-02", userName: "User B", event: "Event 2", eventType: "Competition", hours: 10 },
        { date: "2024-01-03", userName: "User C", event: "Event 3", eventType: "Workshop", hours: 10 },
      ];
      repository.findAll.mockReturnValue(okAsync(tiedData));

      const result = await service.getTopMembersByHours(3);

      expect(result).toHaveLength(3);
      expect(result.every((entry) => entry.totalHours === 10)).toBe(true);
    });

    it("should return default limit of 5 when no limit is specified", async () => {
      repository.findAll.mockReturnValue(okAsync(mockRecords));

      const result = await service.getTopMembersByHours();

      expect(result).toHaveLength(4); // Only 4 unique users in mock data
      expect(result).toEqual([
        { userName: "Jane Smith", totalHours: 23 },
        { userName: "Bob Johnson", totalHours: 20 },
        { userName: "John Doe", totalHours: 15 },
        { userName: "Alice Brown", totalHours: 12 },
      ]);
    });

    it("should correctly sum hours for users with multiple entries", async () => {
      const multipleEntriesData: OutreachRecord[] = [
        { date: "2024-01-01", userName: "John Doe", event: "Event 1", eventType: "Workshop", hours: 5 },
        { date: "2024-01-02", userName: "John Doe", event: "Event 2", eventType: "Competition", hours: 10 },
        { date: "2024-01-03", userName: "John Doe", event: "Event 3", eventType: "Workshop", hours: 15 },
        { date: "2024-01-04", userName: "Jane Smith", event: "Event 4", eventType: "Outreach", hours: 8 },
        { date: "2024-01-05", userName: "Jane Smith", event: "Event 5", eventType: "Workshop", hours: 12 },
      ];
      repository.findAll.mockReturnValue(okAsync(multipleEntriesData));

      const result = await service.getTopMembersByHours(5);

      expect(result).toEqual([
        { userName: "John Doe", totalHours: 30 },
        { userName: "Jane Smith", totalHours: 20 },
      ]);
    });
  });

  describe("getTotalTeamOutreachHours", () => {
    it("should return total hours across all team members", async () => {
      repository.findAll.mockReturnValue(okAsync(mockRecords));

      const result = await service.getTotalTeamOutreachHours();

      // John Doe: 10 + 5 = 15, Jane Smith: 15 + 8 = 23, Bob Johnson: 20, Alice Brown: 12
      // Total: 15 + 23 + 20 + 12 = 70
      expect(result).toBe(70);
    });

    it("should return 0 when fetch fails", async () => {
      repository.findAll.mockReturnValue(errAsync(new Error("Sheet API error")));

      const result = await service.getTotalTeamOutreachHours();

      expect(result).toBe(0);
    });

    it("should return 0 when sheet data is empty", async () => {
      repository.findAll.mockReturnValue(okAsync([]));

      const result = await service.getTotalTeamOutreachHours();

      expect(result).toBe(0);
    });

    it("should return 0 when sheet has only headers", async () => {
      repository.findAll.mockReturnValue(okAsync([]));

      const result = await service.getTotalTeamOutreachHours();

      expect(result).toBe(0);
    });
  });
});
