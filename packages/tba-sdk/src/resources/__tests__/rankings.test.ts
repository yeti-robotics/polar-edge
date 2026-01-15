import { Fetcher } from "@/fetcher";
import { rankingsResource } from "../rankings";

describe("rankingsResource", () => {
  let fetcher: Fetcher;
  let rankings: ReturnType<typeof rankingsResource>;

  beforeEach(() => {
    fetcher = new Fetcher("https://www.thebluealliance.com/api/v3", {
      "X-TBA-Auth-Key": "test-key",
    });
    rankings = rankingsResource(fetcher);
    jest.spyOn(fetcher, "get");
  });

  describe("getDistrictRankings()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const districtKey = "2024ne";
      const mockRankings = {
        rankings: [
          { rank: 1, team_key: "frc254" },
          { rank: 2, team_key: "frc1678" },
        ],
      };
      (fetcher.get as jest.Mock).mockResolvedValue(mockRankings);

      const result = await rankings.getDistrictRankings(districtKey);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/district/{district_key}/rankings",
        { district_key: districtKey },
        undefined
      );
      expect(result).toEqual(mockRankings);
    });

    it("should pass options to fetcher.get", async () => {
      const districtKey = "2024ne";
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue({ rankings: [] });

      await rankings.getDistrictRankings(districtKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/district/{district_key}/rankings",
        { district_key: districtKey },
        options
      );
    });
  });

  describe("getRegionalRankings()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const year = 2024;
      const mockRankings = {
        rankings: [
          { rank: 1, team_key: "frc254" },
          { rank: 2, team_key: "frc1678" },
        ],
      };
      (fetcher.get as jest.Mock).mockResolvedValue(mockRankings);

      const result = await rankings.getRegionalRankings(year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/regional_advancement/{year}/rankings",
        { year: "2024" },
        undefined
      );
      expect(result).toEqual(mockRankings);
    });

    it("should convert year to string", async () => {
      const year = 2023;
      (fetcher.get as jest.Mock).mockResolvedValue({ rankings: [] });

      await rankings.getRegionalRankings(year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/regional_advancement/{year}/rankings",
        { year: "2023" },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const year = 2024;
      const options = { skipCache: true };
      (fetcher.get as jest.Mock).mockResolvedValue({ rankings: [] });

      await rankings.getRegionalRankings(year, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/regional_advancement/{year}/rankings",
        { year: "2024" },
        options
      );
    });
  });

  describe("getEventRankings()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const eventKey = "2024casj";
      const mockRankings = {
        rankings: [
          { rank: 1, team_key: "frc254" },
          { rank: 2, team_key: "frc1678" },
        ],
      };
      (fetcher.get as jest.Mock).mockResolvedValue(mockRankings);

      const result = await rankings.getEventRankings(eventKey);

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
      (fetcher.get as jest.Mock).mockResolvedValue({ rankings: [] });

      await rankings.getEventRankings(eventKey, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/event/{event_key}/rankings",
        { event_key: eventKey },
        options
      );
    });
  });
});
