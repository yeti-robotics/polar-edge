import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { Fetcher } from "@/fetcher";
import { TeamQueryBuilder } from "../team-builder";

// Mock the resources
vi.mock("@/resources/teams", () => ({
  teamsResource: vi.fn(),
}));
vi.mock("@/resources/media", () => ({
  mediaResource: vi.fn(),
}));

import { mediaResource } from "@/resources/media";
import { teamsResource } from "@/resources/teams";

describe("TeamQueryBuilder", () => {
  let fetcher: Fetcher;
  let builder: TeamQueryBuilder;
  const teamNumber = 254;

  beforeEach(() => {
    fetcher = new Fetcher("https://www.thebluealliance.com/api/v3", {
      "X-TBA-Auth-Key": "test-key",
    });
    builder = new TeamQueryBuilder(fetcher, teamNumber);
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a builder with fetcher and teamNumber", () => {
      const b = new TeamQueryBuilder(fetcher, teamNumber);
      expect(b).toBeInstanceOf(TeamQueryBuilder);
    });

    it("should accept optional options", () => {
      const options = { skipCache: true };
      const b = new TeamQueryBuilder(fetcher, teamNumber, options);
      expect(b).toBeInstanceOf(TeamQueryBuilder);
    });
  });

  describe("get()", () => {
    const mockTeam = {
      key: "frc254",
      team_number: 254,
      nickname: "The Cheesy Poofs",
    };

    it("should get team information", async () => {
      const mockGet = vi.fn().mockResolvedValue(mockTeam);
      (teamsResource as Mock).mockReturnValue({
        get: mockGet,
      });

      const result = await builder.get();

      expect(mockGet).toHaveBeenCalledWith(teamNumber, {});
      expect(result).toEqual(mockTeam);
    });

    it("should pass options to get", async () => {
      const mockGet = vi.fn().mockResolvedValue(mockTeam);
      (teamsResource as Mock).mockReturnValue({
        get: mockGet,
      });

      const options = { skipCache: true };
      await builder.get(options);

      expect(mockGet).toHaveBeenCalledWith(teamNumber, options);
    });
  });

  describe("getSimple()", () => {
    const mockTeamSimple = {
      key: "frc254",
      team_number: 254,
      nickname: "The Cheesy Poofs",
    };

    it("should get simple team information", async () => {
      const mockGetSimple = vi.fn().mockResolvedValue(mockTeamSimple);
      (teamsResource as Mock).mockReturnValue({
        getSimple: mockGetSimple,
      });

      const result = await builder.getSimple();

      expect(mockGetSimple).toHaveBeenCalledWith(teamNumber, {});
      expect(result).toEqual(mockTeamSimple);
    });

    it("should pass options to getSimple", async () => {
      const mockGetSimple = vi.fn().mockResolvedValue(mockTeamSimple);
      (teamsResource as Mock).mockReturnValue({
        getSimple: mockGetSimple,
      });

      const options = { skipCache: true };
      await builder.getSimple(options);

      expect(mockGetSimple).toHaveBeenCalledWith(teamNumber, options);
    });
  });

  describe("getEvents()", () => {
    const mockEvents = [
      { key: "2024casj", name: "Silicon Valley Regional", year: 2024 },
      { key: "2023cmptx", name: "Championship", year: 2023 },
    ];

    it("should get all team events when year is not provided", async () => {
      const mockGetEvents = vi.fn().mockResolvedValue(mockEvents);
      (teamsResource as Mock).mockReturnValue({
        getEvents: mockGetEvents,
      });

      const result = await builder.getEvents();

      expect(mockGetEvents).toHaveBeenCalledWith(teamNumber, {});
      expect(result).toEqual(mockEvents);
    });

    it("should get team events for a specific year", async () => {
      const year = 2024;
      const mockGetEventsByYear = vi.fn().mockResolvedValue([mockEvents[0]]);
      (teamsResource as Mock).mockReturnValue({
        getEventsByYear: mockGetEventsByYear,
      });

      const result = await builder.getEvents(year);

      expect(mockGetEventsByYear).toHaveBeenCalledWith(teamNumber, year, {});
      expect(result).toEqual([mockEvents[0]]);
    });

    it("should pass options to getEvents", async () => {
      const mockGetEvents = vi.fn().mockResolvedValue(mockEvents);
      (teamsResource as Mock).mockReturnValue({
        getEvents: mockGetEvents,
      });

      const options = { skipCache: true };
      await builder.getEvents(undefined, options);

      expect(mockGetEvents).toHaveBeenCalledWith(teamNumber, options);
    });

    it("should pass options to getEventsByYear", async () => {
      const year = 2024;
      const mockGetEventsByYear = vi.fn().mockResolvedValue([mockEvents[0]]);
      (teamsResource as Mock).mockReturnValue({
        getEventsByYear: mockGetEventsByYear,
      });

      const options = { skipCache: true };
      await builder.getEvents(year, options);

      expect(mockGetEventsByYear).toHaveBeenCalledWith(teamNumber, year, options);
    });
  });

  describe("getMatches()", () => {
    const eventKey = "2024casj";
    const mockMatches = [
      { key: "2024casj_qm1", comp_level: "qm", match_number: 1 },
      { key: "2024casj_qm2", comp_level: "qm", match_number: 2 },
    ];

    it("should get team matches for an event", async () => {
      const mockGetEventMatches = vi.fn().mockResolvedValue(mockMatches);
      (teamsResource as Mock).mockReturnValue({
        getEventMatches: mockGetEventMatches,
      });

      const result = await builder.getMatches(eventKey);

      expect(mockGetEventMatches).toHaveBeenCalledWith(teamNumber, eventKey, {});
      expect(result).toEqual(mockMatches);
    });

    it("should pass options to getMatches", async () => {
      const mockGetEventMatches = vi.fn().mockResolvedValue(mockMatches);
      (teamsResource as Mock).mockReturnValue({
        getEventMatches: mockGetEventMatches,
      });

      const options = { skipCache: true };
      await builder.getMatches(eventKey, options);

      expect(mockGetEventMatches).toHaveBeenCalledWith(teamNumber, eventKey, options);
    });
  });

  describe("getAwards()", () => {
    const mockAwards = [
      { name: "Chairman's Award", year: 2024 },
      { name: "Engineering Inspiration", year: 2023 },
    ];

    it("should get all team awards when year is not provided", async () => {
      const mockGetAwards = vi.fn().mockResolvedValue(mockAwards);
      (teamsResource as Mock).mockReturnValue({
        getAwards: mockGetAwards,
      });

      const result = await builder.getAwards();

      expect(mockGetAwards).toHaveBeenCalledWith(teamNumber, {});
      expect(result).toEqual(mockAwards);
    });

    it("should get team awards for a specific year", async () => {
      const year = 2024;
      const mockGetAwardsByYear = vi.fn().mockResolvedValue([mockAwards[0]]);
      (teamsResource as Mock).mockReturnValue({
        getAwardsByYear: mockGetAwardsByYear,
      });

      const result = await builder.getAwards(year);

      expect(mockGetAwardsByYear).toHaveBeenCalledWith(teamNumber, year, {});
      expect(result).toEqual([mockAwards[0]]);
    });

    it("should pass options to getAwards", async () => {
      const mockGetAwards = vi.fn().mockResolvedValue(mockAwards);
      (teamsResource as Mock).mockReturnValue({
        getAwards: mockGetAwards,
      });

      const options = { skipCache: true };
      await builder.getAwards(undefined, options);

      expect(mockGetAwards).toHaveBeenCalledWith(teamNumber, options);
    });

    it("should pass options to getAwardsByYear", async () => {
      const year = 2024;
      const mockGetAwardsByYear = vi.fn().mockResolvedValue([mockAwards[0]]);
      (teamsResource as Mock).mockReturnValue({
        getAwardsByYear: mockGetAwardsByYear,
      });

      const options = { skipCache: true };
      await builder.getAwards(year, options);

      expect(mockGetAwardsByYear).toHaveBeenCalledWith(teamNumber, year, options);
    });
  });

  describe("getMedia()", () => {
    const year = 2024;
    const mockMedia = [
      { type: "youtube", foreign_key: "abc123" },
      { type: "imgur", foreign_key: "xyz789" },
    ];

    it("should get team media for a year", async () => {
      const mockGetTeamMediaForYear = vi.fn().mockResolvedValue(mockMedia);
      (mediaResource as Mock).mockReturnValue({
        getTeamMediaForYear: mockGetTeamMediaForYear,
      });

      const result = await builder.getMedia(year);

      expect(mockGetTeamMediaForYear).toHaveBeenCalledWith(teamNumber, year, {});
      expect(result).toEqual(mockMedia);
    });

    it("should pass options to getMedia", async () => {
      const mockGetTeamMediaForYear = vi.fn().mockResolvedValue(mockMedia);
      (mediaResource as Mock).mockReturnValue({
        getTeamMediaForYear: mockGetTeamMediaForYear,
      });

      const options = { skipCache: true };
      await builder.getMedia(year, options);

      expect(mockGetTeamMediaForYear).toHaveBeenCalledWith(teamNumber, year, options);
    });
  });

  describe("getMediaByTag()", () => {
    const tag = "youtube";
    const mockMedia = [{ type: "youtube", foreign_key: "abc123" }];

    it("should get team media by tag", async () => {
      const mockGetTeamMediaByTag = vi.fn().mockResolvedValue(mockMedia);
      (mediaResource as Mock).mockReturnValue({
        getTeamMediaByTag: mockGetTeamMediaByTag,
      });

      const result = await builder.getMediaByTag(tag);

      expect(mockGetTeamMediaByTag).toHaveBeenCalledWith(teamNumber, tag, {});
      expect(result).toEqual(mockMedia);
    });

    it("should pass options to getMediaByTag", async () => {
      const mockGetTeamMediaByTag = vi.fn().mockResolvedValue(mockMedia);
      (mediaResource as Mock).mockReturnValue({
        getTeamMediaByTag: mockGetTeamMediaByTag,
      });

      const options = { skipCache: true };
      await builder.getMediaByTag(tag, options);

      expect(mockGetTeamMediaByTag).toHaveBeenCalledWith(teamNumber, tag, options);
    });
  });

  describe("getMediaByTagAndYear()", () => {
    const tag = "youtube";
    const year = 2024;
    const mockMedia = [{ type: "youtube", foreign_key: "abc123" }];

    it("should get team media by tag and year", async () => {
      const mockGetTeamMediaByTagAndYear = vi.fn().mockResolvedValue(mockMedia);
      (mediaResource as Mock).mockReturnValue({
        getTeamMediaByTagAndYear: mockGetTeamMediaByTagAndYear,
      });

      const result = await builder.getMediaByTagAndYear(tag, year);

      expect(mockGetTeamMediaByTagAndYear).toHaveBeenCalledWith(teamNumber, tag, year, {});
      expect(result).toEqual(mockMedia);
    });

    it("should pass options to getMediaByTagAndYear", async () => {
      const mockGetTeamMediaByTagAndYear = vi.fn().mockResolvedValue(mockMedia);
      (mediaResource as Mock).mockReturnValue({
        getTeamMediaByTagAndYear: mockGetTeamMediaByTagAndYear,
      });

      const options = { skipCache: true };
      await builder.getMediaByTagAndYear(tag, year, options);

      expect(mockGetTeamMediaByTagAndYear).toHaveBeenCalledWith(teamNumber, tag, year, options);
    });
  });
});
