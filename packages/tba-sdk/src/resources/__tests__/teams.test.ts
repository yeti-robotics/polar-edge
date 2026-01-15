import { Fetcher } from "@/fetcher";
import { teamsResource } from "../teams";

describe("teamsResource", () => {
  let fetcher: Fetcher;
  let teams: ReturnType<typeof teamsResource>;

  beforeEach(() => {
    fetcher = new Fetcher("https://www.thebluealliance.com/api/v3", {
      "X-TBA-Auth-Key": "test-key",
    });
    teams = teamsResource(fetcher);
    jest.spyOn(fetcher, "get");
  });

  describe("get()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const mockTeam = { key: "frc254", team_number: 254, nickname: "The Cheesy Poofs" };
      (fetcher.get as jest.Mock).mockResolvedValue(mockTeam);

      const result = await teams.get(teamNumber);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}",
        { team_key: "frc254" },
        undefined
      );
      expect(result).toEqual(mockTeam);
    });

    it("should format team number as frc{number}", async () => {
      const teamNumber = 1678;
      (fetcher.get as jest.Mock).mockResolvedValue({});

      await teams.get(teamNumber);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}",
        { team_key: "frc1678" },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue({});

      await teams.get(teamNumber, options);

      expect(fetcher.get).toHaveBeenCalledWith("/team/{team_key}", { team_key: "frc254" }, options);
    });
  });

  describe("getSimple()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const mockTeam = { key: "frc254", team_number: 254, nickname: "The Cheesy Poofs" };
      (fetcher.get as jest.Mock).mockResolvedValue(mockTeam);

      const result = await teams.getSimple(teamNumber);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/simple",
        { team_key: "frc254" },
        undefined
      );
      expect(result).toEqual(mockTeam);
    });

    it("should format team number as frc{number}", async () => {
      const teamNumber = 1678;
      (fetcher.get as jest.Mock).mockResolvedValue({});

      await teams.getSimple(teamNumber);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/simple",
        { team_key: "frc1678" },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue({});

      await teams.getSimple(teamNumber, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/simple",
        { team_key: "frc254" },
        options
      );
    });
  });

  describe("getYearsParticipated()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const mockYears = [2020, 2021, 2022, 2023, 2024];
      (fetcher.get as jest.Mock).mockResolvedValue(mockYears);

      const result = await teams.getYearsParticipated(teamNumber);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/years_participated",
        { team_key: "frc254" },
        undefined
      );
      expect(result).toEqual(mockYears);
    });

    it("should format team number as frc{number}", async () => {
      const teamNumber = 1678;
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getYearsParticipated(teamNumber);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/years_participated",
        { team_key: "frc1678" },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getYearsParticipated(teamNumber, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/years_participated",
        { team_key: "frc254" },
        options
      );
    });
  });

  describe("getEvents()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const mockEvents = [{ key: "2024casj" }, { key: "2023cmptx" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockEvents);

      const result = await teams.getEvents(teamNumber);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/events",
        { team_key: "frc254" },
        undefined
      );
      expect(result).toEqual(mockEvents);
    });

    it("should format team number as frc{number}", async () => {
      const teamNumber = 1678;
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getEvents(teamNumber);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/events",
        { team_key: "frc1678" },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getEvents(teamNumber, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/events",
        { team_key: "frc254" },
        options
      );
    });
  });

  describe("getEventsByYear()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const year = 2024;
      const mockEvents = [{ key: "2024casj" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockEvents);

      const result = await teams.getEventsByYear(teamNumber, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/events/{year}",
        { team_key: "frc254", year: "2024" },
        undefined
      );
      expect(result).toEqual(mockEvents);
    });

    it("should convert year to string", async () => {
      const teamNumber = 254;
      const year = 2023;
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getEventsByYear(teamNumber, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/events/{year}",
        { team_key: "frc254", year: "2023" },
        undefined
      );
    });

    it("should format team number as frc{number}", async () => {
      const teamNumber = 1678;
      const year = 2024;
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getEventsByYear(teamNumber, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/events/{year}",
        { team_key: "frc1678", year: "2024" },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const year = 2024;
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getEventsByYear(teamNumber, year, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/events/{year}",
        { team_key: "frc254", year: "2024" },
        options
      );
    });
  });

  describe("getEventsSimple()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const mockEvents = [{ key: "2024casj" }, { key: "2023cmptx" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockEvents);

      const result = await teams.getEventsSimple(teamNumber);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/events/simple",
        { team_key: "frc254" },
        undefined
      );
      expect(result).toEqual(mockEvents);
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getEventsSimple(teamNumber, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/events/simple",
        { team_key: "frc254" },
        options
      );
    });
  });

  describe("getEventsByYearSimple()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const year = 2024;
      const mockEvents = [{ key: "2024casj" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockEvents);

      const result = await teams.getEventsByYearSimple(teamNumber, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/events/{year}/simple",
        { team_key: "frc254", year: "2024" },
        undefined
      );
      expect(result).toEqual(mockEvents);
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const year = 2024;
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getEventsByYearSimple(teamNumber, year, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/events/{year}/simple",
        { team_key: "frc254", year: "2024" },
        options
      );
    });
  });

  describe("getEventMatches()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const eventKey = "2024casj";
      const mockMatches = [{ key: "2024casj_qm1" }, { key: "2024casj_qm2" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockMatches);

      const result = await teams.getEventMatches(teamNumber, eventKey);

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

      await teams.getEventMatches(teamNumber, eventKey);

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

      await teams.getEventMatches(teamNumber, eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/event/{event_key}/matches",
        { team_key: "frc254", event_key: eventKey },
        options
      );
    });
  });

  describe("getEventMatchesSimple()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const eventKey = "2024casj";
      const mockMatches = [{ key: "2024casj_qm1" }, { key: "2024casj_qm2" }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockMatches);

      const result = await teams.getEventMatchesSimple(teamNumber, eventKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/event/{event_key}/matches/simple",
        { team_key: "frc254", event_key: eventKey },
        undefined
      );
      expect(result).toEqual(mockMatches);
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const eventKey = "2024casj";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getEventMatchesSimple(teamNumber, eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/event/{event_key}/matches/simple",
        { team_key: "frc254", event_key: eventKey },
        options
      );
    });
  });

  describe("getAwards()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const mockAwards = [{ name: "Chairman's Award", year: 2024 }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockAwards);

      const result = await teams.getAwards(teamNumber);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/awards",
        { team_key: "frc254" },
        undefined
      );
      expect(result).toEqual(mockAwards);
    });

    it("should format team number as frc{number}", async () => {
      const teamNumber = 1678;
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getAwards(teamNumber);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/awards",
        { team_key: "frc1678" },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getAwards(teamNumber, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/awards",
        { team_key: "frc254" },
        options
      );
    });
  });

  describe("getAwardsByYear()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const year = 2024;
      const mockAwards = [{ name: "Chairman's Award", year: 2024 }];
      (fetcher.get as jest.Mock).mockResolvedValue(mockAwards);

      const result = await teams.getAwardsByYear(teamNumber, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/awards/{year}",
        { team_key: "frc254", year: "2024" },
        undefined
      );
      expect(result).toEqual(mockAwards);
    });

    it("should convert year to string", async () => {
      const teamNumber = 254;
      const year = 2023;
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getAwardsByYear(teamNumber, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/awards/{year}",
        { team_key: "frc254", year: "2023" },
        undefined
      );
    });

    it("should format team number as frc{number}", async () => {
      const teamNumber = 1678;
      const year = 2024;
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getAwardsByYear(teamNumber, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/awards/{year}",
        { team_key: "frc1678", year: "2024" },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const year = 2024;
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue([]);

      await teams.getAwardsByYear(teamNumber, year, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/awards/{year}",
        { team_key: "frc254", year: "2024" },
        options
      );
    });
  });
});
