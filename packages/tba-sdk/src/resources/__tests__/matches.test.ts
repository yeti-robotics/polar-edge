import { Fetcher } from "@/fetcher";
import { matchesResource } from "../matches";

describe("matchesResource", () => {
  let fetcher: Fetcher;
  let matches: ReturnType<typeof matchesResource>;

  beforeEach(() => {
    fetcher = new Fetcher("https://www.thebluealliance.com/api/v3", {
      "X-TBA-Auth-Key": "test-key",
    });
    matches = matchesResource(fetcher);
    jest.spyOn(fetcher, "get");
  });

  describe("getByKey()", () => {
    it("should call fetcher.get and inject year from match key", async () => {
      const matchKey = "2024casj_qm1";
      const mockMatch = {
        key: matchKey,
        event_key: "2024casj",
        comp_level: "qm",
        match_number: 1,
      };
      (fetcher.get as jest.Mock).mockResolvedValue(mockMatch);

      const result = await matches.getByKey(matchKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/match/{match_key}",
        { match_key: matchKey },
        undefined
      );
      expect(result).toEqual({
        ...mockMatch,
        year: 2024,
      });
    });

    it("should inject year from event_key in match data", async () => {
      const matchKey = "2023cmptx_qf1m1";
      const mockMatch = {
        key: matchKey,
        event_key: "2023cmptx",
        comp_level: "qf",
        match_number: 1,
      };
      (fetcher.get as jest.Mock).mockResolvedValue(mockMatch);

      const result = await matches.getByKey(matchKey);

      expect(result.year).toBe(2023);
    });

    it("should pass options to fetcher.get", async () => {
      const matchKey = "2024casj_qm1";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue({
        key: matchKey,
        event_key: "2024casj",
      });

      await matches.getByKey(matchKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/match/{match_key}",
        { match_key: matchKey },
        options
      );
    });
  });

  describe("getEventMatches()", () => {
    it("should call fetcher.get and inject year into all matches", async () => {
      const eventKey = "2024casj";
      const mockMatches = [
        { key: "2024casj_qm1", event_key: eventKey, comp_level: "qm", match_number: 1 },
        { key: "2024casj_qm2", event_key: eventKey, comp_level: "qm", match_number: 2 },
      ];
      (fetcher.get as jest.Mock).mockResolvedValue(mockMatches);

      const result = await matches.getEventMatches(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/matches",
        { event_key: eventKey },
        undefined
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ ...mockMatches[0], year: 2024 });
      expect(result[1]).toEqual({ ...mockMatches[1], year: 2024 });
    });

    it("should inject year from event_key for each match", async () => {
      const eventKey = "2023cmptx";
      const mockMatches = [
        { key: "2023cmptx_qf1m1", event_key: eventKey, comp_level: "qf", match_number: 1 },
      ];
      (fetcher.get as jest.Mock).mockResolvedValue(mockMatches);

      const result = await matches.getEventMatches(eventKey);

      expect(result[0].year).toBe(2023);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await matches.getEventMatches(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/matches",
        { event_key: eventKey },
        options
      );
    });

    it("should handle empty array", async () => {
      const eventKey = "2024casj";
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      const result = await matches.getEventMatches(eventKey);

      expect(result).toEqual([]);
    });
  });

  describe("getEventMatchesSimple()", () => {
    it("should call fetcher.get and inject year into all matches", async () => {
      const eventKey = "2024casj";
      const mockMatches = [
        { key: "2024casj_qm1", event_key: eventKey, comp_level: "qm", match_number: 1 },
        { key: "2024casj_qm2", event_key: eventKey, comp_level: "qm", match_number: 2 },
      ];
      (fetcher.get as jest.Mock).mockResolvedValue(mockMatches);

      const result = await matches.getEventMatchesSimple(eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/matches/simple",
        { event_key: eventKey },
        undefined
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ ...mockMatches[0], year: 2024 });
      expect(result[1]).toEqual({ ...mockMatches[1], year: 2024 });
    });

    it("should inject year from event_key for each match", async () => {
      const eventKey = "2023cmptx";
      const mockMatches = [
        { key: "2023cmptx_qf1m1", event_key: eventKey, comp_level: "qf", match_number: 1 },
      ];
      (fetcher.get as jest.Mock).mockResolvedValue(mockMatches);

      const result = await matches.getEventMatchesSimple(eventKey);

      expect(result[0].year).toBe(2023);
    });

    it("should pass options to fetcher.get", async () => {
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await matches.getEventMatchesSimple(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/matches/simple",
        { event_key: eventKey },
        options
      );
    });
  });

  describe("getTeamEventMatches()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const eventKey = "2024casj";
      const mockMatches = [{ key: "2024casj_qm1" }, { key: "2024casj_qm2" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockMatches);

      const result = await matches.getTeamEventMatches(teamNumber, eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/event/{event_key}/matches",
        { team_key: "frc254", event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockMatches);
    });

    it("should format team number as frc{number}", async () => {
      const teamNumber = 1678;
      const eventKey = "2024casj";
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await matches.getTeamEventMatches(teamNumber, eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/event/{event_key}/matches",
        { team_key: "frc1678", event_key: eventKey },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await matches.getTeamEventMatches(teamNumber, eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/event/{event_key}/matches",
        { team_key: "frc254", event_key: eventKey },
        options
      );
    });
  });

  describe("getTeamEventMatchesSimple()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const eventKey = "2024casj";
      const mockMatches = [{ key: "2024casj_qm1" }, { key: "2024casj_qm2" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockMatches);

      const result = await matches.getTeamEventMatchesSimple(teamNumber, eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/event/{event_key}/matches/simple",
        { team_key: "frc254", event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockMatches);
    });

    it("should format team number as frc{number}", async () => {
      const teamNumber = 1678;
      const eventKey = "2024casj";
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await matches.getTeamEventMatchesSimple(teamNumber, eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/event/{event_key}/matches/simple",
        { team_key: "frc1678", event_key: eventKey },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await matches.getTeamEventMatchesSimple(teamNumber, eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/event/{event_key}/matches/simple",
        { team_key: "frc254", event_key: eventKey },
        options
      );
    });
  });
});
