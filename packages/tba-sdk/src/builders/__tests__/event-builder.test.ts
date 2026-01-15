import { Fetcher } from "@/fetcher";
import { eventsResource } from "@/resources/events";
import { rankingsResource } from "@/resources/rankings";
import { EventQueryBuilder } from "../event-builder";
import { MatchQueryBuilder } from "../match-builder";

// Mock the resources
jest.mock("@/resources/events");
jest.mock("@/resources/rankings");
jest.mock("../match-builder");

describe("EventQueryBuilder", () => {
  let fetcher: Fetcher;
  let builder: EventQueryBuilder;
  const eventKey = "2024casj";

  beforeEach(() => {
    fetcher = new Fetcher("https://www.thebluealliance.com/api/v3", {
      "X-TBA-Auth-Key": "test-key",
    });
    builder = new EventQueryBuilder(fetcher, eventKey);
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a builder with fetcher and eventKey", () => {
      const b = new EventQueryBuilder(fetcher, eventKey);
      expect(b).toBeInstanceOf(EventQueryBuilder);
    });

    it("should accept optional options", () => {
      const options = { skipCache: true };
      const b = new EventQueryBuilder(fetcher, eventKey, options);
      expect(b).toBeInstanceOf(EventQueryBuilder);
    });
  });

  describe("matches()", () => {
    it("should return a MatchQueryBuilder", () => {
      const matchBuilder = builder.matches();
      expect(matchBuilder).toBeInstanceOf(MatchQueryBuilder);
    });

    it("should pass fetcher and eventKey to MatchQueryBuilder", () => {
      const matchBuilder = builder.matches();
      expect(MatchQueryBuilder).toHaveBeenCalledWith(fetcher, eventKey, {});
    });

    it("should pass options to MatchQueryBuilder", () => {
      const options = { skipCache: true };
      const builderWithOptions = new EventQueryBuilder(fetcher, eventKey, options);
      builderWithOptions.matches();
      expect(MatchQueryBuilder).toHaveBeenCalledWith(fetcher, eventKey, options);
    });
  });

  describe("get()", () => {
    const mockEvent = {
      key: eventKey,
      name: "Silicon Valley Regional",
      year: 2024,
    };

    it("should get event information", async () => {
      const mockGet = jest.fn().mockResolvedValue(mockEvent);
      (eventsResource as jest.Mock).mockReturnValue({
        get: mockGet,
      });

      const result = await builder.get();

      expect(mockGet).toHaveBeenCalledWith(eventKey, {});
      expect(result).toEqual(mockEvent);
    });

    it("should pass options to get", async () => {
      const mockGet = jest.fn().mockResolvedValue(mockEvent);
      (eventsResource as jest.Mock).mockReturnValue({
        get: mockGet,
      });

      const options = { skipCache: true };
      await builder.get(options);

      expect(mockGet).toHaveBeenCalledWith(eventKey, options);
    });

    it("should use builder options when no options provided", async () => {
      const builderOptions = { skipCache: true };
      const builderWithOptions = new EventQueryBuilder(fetcher, eventKey, builderOptions);
      const mockGet = jest.fn().mockResolvedValue(mockEvent);
      (eventsResource as jest.Mock).mockReturnValue({
        get: mockGet,
      });

      await builderWithOptions.get();

      expect(mockGet).toHaveBeenCalledWith(eventKey, builderOptions);
    });
  });

  describe("getSimple()", () => {
    const mockEventSimple = {
      key: eventKey,
      name: "Silicon Valley Regional",
      year: 2024,
    };

    it("should get simple event information", async () => {
      const mockGetSimple = jest.fn().mockResolvedValue(mockEventSimple);
      (eventsResource as jest.Mock).mockReturnValue({
        getSimple: mockGetSimple,
      });

      const result = await builder.getSimple();

      expect(mockGetSimple).toHaveBeenCalledWith(eventKey, {});
      expect(result).toEqual(mockEventSimple);
    });

    it("should pass options to getSimple", async () => {
      const mockGetSimple = jest.fn().mockResolvedValue(mockEventSimple);
      (eventsResource as jest.Mock).mockReturnValue({
        getSimple: mockGetSimple,
      });

      const options = { skipCache: true };
      await builder.getSimple(options);

      expect(mockGetSimple).toHaveBeenCalledWith(eventKey, options);
    });
  });

  describe("getTeams()", () => {
    const mockTeams = [
      { key: "frc254", team_number: 254 },
      { key: "frc1678", team_number: 1678 },
    ];

    it("should get teams for the event", async () => {
      const mockGetTeams = jest.fn().mockResolvedValue(mockTeams);
      (eventsResource as jest.Mock).mockReturnValue({
        getTeams: mockGetTeams,
      });

      const result = await builder.getTeams();

      expect(mockGetTeams).toHaveBeenCalledWith(eventKey, {});
      expect(result).toEqual(mockTeams);
    });

    it("should pass options to getTeams", async () => {
      const mockGetTeams = jest.fn().mockResolvedValue(mockTeams);
      (eventsResource as jest.Mock).mockReturnValue({
        getTeams: mockGetTeams,
      });

      const options = { skipCache: true };
      await builder.getTeams(options);

      expect(mockGetTeams).toHaveBeenCalledWith(eventKey, options);
    });
  });

  describe("getRankings()", () => {
    const mockRankings = {
      rankings: [
        { rank: 1, team_key: "frc254" },
        { rank: 2, team_key: "frc1678" },
      ],
    };

    it("should get rankings for the event", async () => {
      const mockGetEventRankings = jest.fn().mockResolvedValue(mockRankings);
      (rankingsResource as jest.Mock).mockReturnValue({
        getEventRankings: mockGetEventRankings,
      });

      const result = await builder.getRankings();

      expect(mockGetEventRankings).toHaveBeenCalledWith(eventKey, {});
      expect(result).toEqual(mockRankings);
    });

    it("should pass options to getRankings", async () => {
      const mockGetEventRankings = jest.fn().mockResolvedValue(mockRankings);
      (rankingsResource as jest.Mock).mockReturnValue({
        getEventRankings: mockGetEventRankings,
      });

      const options = { skipCache: true };
      await builder.getRankings(options);

      expect(mockGetEventRankings).toHaveBeenCalledWith(eventKey, options);
    });
  });

  describe("getAwards()", () => {
    const mockAwards = [
      { name: "Chairman's Award", award_type: 0 },
      { name: "Engineering Inspiration", award_type: 1 },
    ];

    it("should get awards for the event", async () => {
      const mockGetAwards = jest.fn().mockResolvedValue(mockAwards);
      (eventsResource as jest.Mock).mockReturnValue({
        getAwards: mockGetAwards,
      });

      const result = await builder.getAwards();

      expect(mockGetAwards).toHaveBeenCalledWith(eventKey, {});
      expect(result).toEqual(mockAwards);
    });

    it("should pass options to getAwards", async () => {
      const mockGetAwards = jest.fn().mockResolvedValue(mockAwards);
      (eventsResource as jest.Mock).mockReturnValue({
        getAwards: mockGetAwards,
      });

      const options = { skipCache: true };
      await builder.getAwards(options);

      expect(mockGetAwards).toHaveBeenCalledWith(eventKey, options);
    });
  });
});
