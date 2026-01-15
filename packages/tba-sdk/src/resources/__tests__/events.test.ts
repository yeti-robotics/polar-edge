import { Fetcher } from "@/fetcher";
import { eventsResource } from "../events";

describe("eventsResource", () => {
  let fetcher: Fetcher;
  let events: ReturnType<typeof eventsResource>;

  beforeEach(() => {
    fetcher = new Fetcher("https://www.thebluealliance.com/api/v3", {
      "X-TBA-Auth-Key": "test-key",
    });
    events = eventsResource(fetcher);
    jest.spyOn(fetcher, "get");
  });

  describe("get()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockEvent = { key: eventKey, name: "Silicon Valley Regional" };
      (fetcher.get as jest.Mock).mockResolvedValue(mockEvent);

      const result = await events.get(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockEvent);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue({});

      await events.get(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getSimple()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockEvent = { key: eventKey, name: "Silicon Valley Regional" };
      (fetcher.get as jest.Mock).mockResolvedValue(mockEvent);

      const result = await events.getSimple(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/simple",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockEvent);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue({});

      await events.getSimple(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/simple",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getByYear()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const year = 2024;
      const mockEvents = [{ key: "2024casj" }, { key: "2024cmptx" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockEvents);

      const result = await events.getByYear(year);

      expect(fetcher.get).toHaveBeenCalledWith("/events/{year}", { year: "2024" }, undefined);
      expect(result).toEqual(mockEvents);
    });

    it("should convert year to string", async () => {
      const year = 2023;
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await events.getByYear(year);

      expect(fetcher.get).toHaveBeenCalledWith("/events/{year}", { year: "2023" }, undefined);
    });

    it("should pass options to fetcher.get", async () => {
      const year = 2024;
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await events.getByYear(year, options);

      expect(fetcher.get).toHaveBeenCalledWith("/events/{year}", { year: "2024" }, options);
    });
  });

  describe("getByYearSimple()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const year = 2024;
      const mockEvents = [{ key: "2024casj" }, { key: "2024cmptx" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockEvents);

      const result = await events.getByYearSimple(year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/events/{year}/simple",
        { year: "2024" },
        undefined
      );
      expect(result).toEqual(mockEvents);
    });

    it("should pass options to fetcher.get", async () => {
      const year = 2024;
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await events.getByYearSimple(year, options);

      expect(fetcher.get).toHaveBeenCalledWith("/events/{year}/simple", { year: "2024" }, options);
    });
  });

  describe("getTeams()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockTeams = [{ key: "frc254" }, { key: "frc1678" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockTeams);

      const result = await events.getTeams(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/teams",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockTeams);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await events.getTeams(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/teams",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getTeamsSimple()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockTeams = [{ key: "frc254" }, { key: "frc1678" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockTeams);

      const result = await events.getTeamsSimple(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/teams/simple",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockTeams);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await events.getTeamsSimple(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/teams/simple",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getAwards()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockAwards = [{ name: "Chairman's Award" }, { name: "Engineering Inspiration" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockAwards);

      const result = await events.getAwards(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/awards",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockAwards);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await events.getAwards(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/awards",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getAlliances()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockAlliances = [{ picks: ["frc254", "frc1678"] }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockAlliances);

      const result = await events.getAlliances(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/alliances",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockAlliances);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await events.getAlliances(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/alliances",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getDistrictPoints()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockPoints = { points: { frc254: 10 } };
      (fetcher.get as jest.Mock).mockResolvedValue(mockPoints);

      const result = await events.getDistrictPoints(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/district_points",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockPoints);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue({});

      await events.getDistrictPoints(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/district_points",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getInsights()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockInsights = { qual: {}, playoff: {} };
      (fetcher.get as jest.Mock).mockResolvedValue(mockInsights);

      const result = await events.getInsights(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/insights",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockInsights);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue({});

      await events.getInsights(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/insights",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getOPRs()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockOPRs = { oprs: { frc254: 25.5 } };
      (fetcher.get as jest.Mock).mockResolvedValue(mockOPRs);

      const result = await events.getOPRs(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/oprs",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockOPRs);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue({});

      await events.getOPRs(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/oprs",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getPredictions()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockPredictions = { match_predictions: [] };
      (fetcher.get as jest.Mock).mockResolvedValue(mockPredictions);

      const result = await events.getPredictions(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/predictions",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockPredictions);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue({});

      await events.getPredictions(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/predictions",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getMatches()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockMatches = [{ key: "2024casj_qm1" }, { key: "2024casj_qm2" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockMatches);

      const result = await events.getMatches(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/matches",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockMatches);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await events.getMatches(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/matches",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getMatchesSimple()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockMatches = [{ key: "2024casj_qm1" }, { key: "2024casj_qm2" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockMatches);

      const result = await events.getMatchesSimple(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/matches/simple",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockMatches);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await events.getMatchesSimple(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/matches/simple",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getRankings()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockRankings = { rankings: [{ rank: 1, team_key: "frc254" }] };
      (fetcher.get as jest.Mock).mockResolvedValue(mockRankings);

      const result = await events.getRankings(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/rankings",
        { event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockRankings);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue({});

      await events.getRankings(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/rankings",
        { event_key: eventKey },
        options
      );
    });
  });
});
