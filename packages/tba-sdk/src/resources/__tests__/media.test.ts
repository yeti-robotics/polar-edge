import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { Fetcher } from "@/fetcher";
import { mediaResource } from "../media";

describe("mediaResource", () => {
  let fetcher: Fetcher;
  let media: ReturnType<typeof mediaResource>;

  beforeEach(() => {
    fetcher = new Fetcher("https://www.thebluealliance.com/api/v3", {
      "X-TBA-Auth-Key": "test-key",
    });
    media = mediaResource(fetcher);
    vi.spyOn(fetcher, "get");
  });

  describe("getTeamMediaForYear()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const year = 2024;
      const mockMedia = [
        { type: "youtube", foreign_key: "abc123" },
        { type: "imgur", foreign_key: "xyz789" },
      ];
      (fetcher.get as Mock).mockResolvedValue(mockMedia);

      const result = await media.getTeamMediaForYear(teamNumber, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/{year}",
        { team_key: "frc254", year: "2024" },
        undefined
      );
      expect(result).toEqual(mockMedia);
    });

    it("should format team number as frc{number}", async () => {
      const teamNumber = 1678;
      const year = 2024;
      (fetcher.get as Mock).mockResolvedValue([]);

      await media.getTeamMediaForYear(teamNumber, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/{year}",
        { team_key: "frc1678", year: "2024" },
        undefined
      );
    });

    it("should convert year to string", async () => {
      const teamNumber = 254;
      const year = 2023;
      (fetcher.get as Mock).mockResolvedValue([]);

      await media.getTeamMediaForYear(teamNumber, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/{year}",
        { team_key: "frc254", year: "2023" },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const year = 2024;
      const options = { skipCache: true };
      (fetcher.get as Mock).mockResolvedValue([]);

      await media.getTeamMediaForYear(teamNumber, year, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/{year}",
        { team_key: "frc254", year: "2024" },
        options
      );
    });
  });

  describe("getTeamMediaByTag()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const tag = "youtube";
      const mockMedia = [{ type: "youtube", foreign_key: "abc123" }];
      (fetcher.get as Mock).mockResolvedValue(mockMedia);

      const result = await media.getTeamMediaByTag(teamNumber, tag);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/tag/{media_tag}",
        { team_key: "frc254", media_tag: tag },
        undefined
      );
      expect(result).toEqual(mockMedia);
    });

    it("should format team number as frc{number}", async () => {
      const teamNumber = 1678;
      const tag = "youtube";
      (fetcher.get as Mock).mockResolvedValue([]);

      await media.getTeamMediaByTag(teamNumber, tag);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/tag/{media_tag}",
        { team_key: "frc1678", media_tag: tag },
        undefined
      );
    });

    it("should pass tag as media_tag parameter", async () => {
      const teamNumber = 254;
      const tag = "imgur";
      (fetcher.get as Mock).mockResolvedValue([]);

      await media.getTeamMediaByTag(teamNumber, tag);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/tag/{media_tag}",
        { team_key: "frc254", media_tag: "imgur" },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const tag = "youtube";
      const options = { skipCache: true };
      (fetcher.get as Mock).mockResolvedValue([]);

      await media.getTeamMediaByTag(teamNumber, tag, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/tag/{media_tag}",
        { team_key: "frc254", media_tag: tag },
        options
      );
    });
  });

  describe("getTeamMediaByTagAndYear()", () => {
    it("should call fetcher.get with correct path and params", async () => {
      const teamNumber = 254;
      const tag = "youtube";
      const year = 2024;
      const mockMedia = [{ type: "youtube", foreign_key: "abc123" }];
      (fetcher.get as Mock).mockResolvedValue(mockMedia);

      const result = await media.getTeamMediaByTagAndYear(teamNumber, tag, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/tag/{media_tag}/{year}",
        { team_key: "frc254", media_tag: tag, year: "2024" },
        undefined
      );
      expect(result).toEqual(mockMedia);
    });

    it("should format team number as frc{number}", async () => {
      const teamNumber = 1678;
      const tag = "youtube";
      const year = 2024;
      (fetcher.get as Mock).mockResolvedValue([]);

      await media.getTeamMediaByTagAndYear(teamNumber, tag, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/tag/{media_tag}/{year}",
        { team_key: "frc1678", media_tag: tag, year: "2024" },
        undefined
      );
    });

    it("should convert year to string", async () => {
      const teamNumber = 254;
      const tag = "youtube";
      const year = 2023;
      (fetcher.get as Mock).mockResolvedValue([]);

      await media.getTeamMediaByTagAndYear(teamNumber, tag, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/tag/{media_tag}/{year}",
        { team_key: "frc254", media_tag: tag, year: "2023" },
        undefined
      );
    });

    it("should pass tag as media_tag parameter", async () => {
      const teamNumber = 254;
      const tag = "imgur";
      const year = 2024;
      (fetcher.get as Mock).mockResolvedValue([]);

      await media.getTeamMediaByTagAndYear(teamNumber, tag, year);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/tag/{media_tag}/{year}",
        { team_key: "frc254", media_tag: "imgur", year: "2024" },
        undefined
      );
    });

    it("should pass options to fetcher.get", async () => {
      const teamNumber = 254;
      const tag = "youtube";
      const year = 2024;
      const options = { skipCache: true };
      (fetcher.get as Mock).mockResolvedValue([]);

      await media.getTeamMediaByTagAndYear(teamNumber, tag, year, options);

      expect(fetcher.get).toHaveBeenCalledWith(
        "/team/{team_key}/media/tag/{media_tag}/{year}",
        { team_key: "frc254", media_tag: tag, year: "2024" },
        options
      );
    });
  });
});
