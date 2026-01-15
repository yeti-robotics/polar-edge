import { Fetcher } from "@/fetcher";
import { MatchQueryBuilder } from "../match-builder";

// Mock the matches resource
jest.mock("@/resources/matches", () => ({
  matchesResource: jest.fn(),
}));

import { matchesResource } from "@/resources/matches";

describe("MatchQueryBuilder", () => {
  let fetcher: Fetcher;
  let builder: MatchQueryBuilder;
  const eventKey = "2024casj";

  beforeEach(() => {
    fetcher = new Fetcher("https://www.thebluealliance.com/api/v3", {
      "X-TBA-Auth-Key": "test-key",
    });
    builder = new MatchQueryBuilder(fetcher, eventKey);
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a builder with fetcher and eventKey", () => {
      const b = new MatchQueryBuilder(fetcher, eventKey);
      expect(b).toBeInstanceOf(MatchQueryBuilder);
    });

    it("should accept optional options", () => {
      const options = { skipCache: true };
      const b = new MatchQueryBuilder(fetcher, eventKey, options);
      expect(b).toBeInstanceOf(MatchQueryBuilder);
    });
  });

  describe("where()", () => {
    it("should set filters", () => {
      const result = builder.where({ compLevel: "qm" });
      expect(result).toBe(builder);
    });

    it("should merge multiple filters", () => {
      builder.where({ compLevel: "qm" });
      builder.where({ matchNumber: 1 });
      const result = builder.where({ setNumber: 2 });
      expect(result).toBe(builder);
    });
  });

  describe("fetch()", () => {
    const mockMatches = [
      {
        key: "2024casj_qm1",
        comp_level: "qm",
        match_number: 1,
        set_number: 1,
        event_key: eventKey,
        year: 2024,
      },
      {
        key: "2024casj_qm2",
        comp_level: "qm",
        match_number: 2,
        set_number: 1,
        event_key: eventKey,
        year: 2024,
      },
      {
        key: "2024casj_qf1m1",
        comp_level: "qf",
        match_number: 1,
        set_number: 1,
        event_key: eventKey,
        year: 2024,
      },
    ];

    it("should fetch all matches when no filters are applied", async () => {
      const mockGetEventMatches = jest.fn().mockResolvedValue(mockMatches);
      (matchesResource as jest.Mock).mockReturnValue({
        getEventMatches: mockGetEventMatches,
      });

      const result = await builder.fetch();

      expect(mockGetEventMatches).toHaveBeenCalledWith(eventKey, {});
      expect(result).toEqual(mockMatches);
    });

    it("should filter by compLevel", async () => {
      const mockGetEventMatches = jest.fn().mockResolvedValue(mockMatches);
      (matchesResource as jest.Mock).mockReturnValue({
        getEventMatches: mockGetEventMatches,
      });

      builder.where({ compLevel: "qm" });
      const result = await builder.fetch();

      expect(result).toHaveLength(2);
      expect(result.every((m) => m.comp_level === "qm")).toBe(true);
    });

    it("should filter by matchNumber", async () => {
      const mockGetEventMatches = jest.fn().mockResolvedValue(mockMatches);
      (matchesResource as jest.Mock).mockReturnValue({
        getEventMatches: mockGetEventMatches,
      });

      builder.where({ matchNumber: 1 });
      const result = await builder.fetch();

      expect(result).toHaveLength(2);
      expect(result.every((m) => m.match_number === 1)).toBe(true);
    });

    it("should filter by setNumber", async () => {
      const mockGetEventMatches = jest.fn().mockResolvedValue(mockMatches);
      (matchesResource as jest.Mock).mockReturnValue({
        getEventMatches: mockGetEventMatches,
      });

      builder.where({ setNumber: 1 });
      const result = await builder.fetch();

      expect(result).toHaveLength(3);
      expect(result.every((m) => m.set_number === 1)).toBe(true);
    });

    it("should filter by multiple criteria", async () => {
      const mockGetEventMatches = jest.fn().mockResolvedValue(mockMatches);
      (matchesResource as jest.Mock).mockReturnValue({
        getEventMatches: mockGetEventMatches,
      });

      builder.where({ compLevel: "qm", matchNumber: 1 });
      const result = await builder.fetch();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMatches[0]);
    });

    it("should pass options to getEventMatches", async () => {
      const mockGetEventMatches = jest.fn().mockResolvedValue(mockMatches);
      (matchesResource as jest.Mock).mockReturnValue({
        getEventMatches: mockGetEventMatches,
      });

      const options = { skipCache: true };
      await builder.fetch(options);

      expect(mockGetEventMatches).toHaveBeenCalledWith(eventKey, options);
    });

    it("should use builder options when no options provided", async () => {
      const builderOptions = { skipCache: true };
      const builderWithOptions = new MatchQueryBuilder(fetcher, eventKey, builderOptions);
      const mockGetEventMatches = jest.fn().mockResolvedValue(mockMatches);
      (matchesResource as jest.Mock).mockReturnValue({
        getEventMatches: mockGetEventMatches,
      });

      await builderWithOptions.fetch();

      expect(mockGetEventMatches).toHaveBeenCalledWith(eventKey, builderOptions);
    });

    it("should return empty array when no matches match filters", async () => {
      const mockGetEventMatches = jest.fn().mockResolvedValue(mockMatches);
      (matchesResource as jest.Mock).mockReturnValue({
        getEventMatches: mockGetEventMatches,
      });

      builder.where({ compLevel: "f" });
      const result = await builder.fetch();

      expect(result).toEqual([]);
    });
  });

  describe("getByKey()", () => {
    const mockMatch = {
      key: "2024casj_qm1",
      comp_level: "qm",
      match_number: 1,
      set_number: 1,
      event_key: eventKey,
      year: 2024,
    };

    it("should get a match by key", async () => {
      const mockGetByKey = jest.fn().mockResolvedValue(mockMatch);
      (matchesResource as jest.Mock).mockReturnValue({
        getByKey: mockGetByKey,
      });

      const result = await builder.getByKey("2024casj_qm1");

      expect(mockGetByKey).toHaveBeenCalledWith("2024casj_qm1", {});
      expect(result).toEqual(mockMatch);
    });

    it("should pass options to getByKey", async () => {
      const mockGetByKey = jest.fn().mockResolvedValue(mockMatch);
      (matchesResource as jest.Mock).mockReturnValue({
        getByKey: mockGetByKey,
      });

      const options = { skipCache: true };
      await builder.getByKey("2024casj_qm1", options);

      expect(mockGetByKey).toHaveBeenCalledWith("2024casj_qm1", options);
    });

    it("should use builder options when no options provided", async () => {
      const builderOptions = { skipCache: true };
      const builderWithOptions = new MatchQueryBuilder(fetcher, eventKey, builderOptions);
      const mockGetByKey = jest.fn().mockResolvedValue(mockMatch);
      (matchesResource as jest.Mock).mockReturnValue({
        getByKey: mockGetByKey,
      });

      await builderWithOptions.getByKey("2024casj_qm1");

      expect(mockGetByKey).toHaveBeenCalledWith("2024casj_qm1", builderOptions);
    });
  });
});
