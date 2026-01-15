import type { Fetcher } from "@/fetcher";
import type { FetcherOptions } from "@/fetcher/types";

/**
 * Functional resource for The Blue Alliance Media API.
 * All methods are fully type-safe - path parameters and return types are inferred.
 *
 * @see https://www.thebluealliance.com/apidocs/v3
 */
export const mediaResource = (fetcher: Fetcher) => ({
  /**
   * Get team media for a specific year
   */
  getTeamMediaForYear: (teamNumber: number, year: number, options?: FetcherOptions) =>
    fetcher.get(
      "/team/{team_key}/media/{year}",
      { team_key: `frc${teamNumber}`, year: String(year) },
      options
    ),

  /**
   * Get team media for a specific tag
   */
  getTeamMediaByTag: (teamNumber: number, tag: string, options?: FetcherOptions) =>
    fetcher.get(
      "/team/{team_key}/media/tag/{media_tag}",
      { team_key: `frc${teamNumber}`, media_tag: tag },
      options
    ),

  /**
   * Get team media for a specific tag and year
   */
  getTeamMediaByTagAndYear: (
    teamNumber: number,
    tag: string,
    year: number,
    options?: FetcherOptions
  ) =>
    fetcher.get(
      "/team/{team_key}/media/tag/{media_tag}/{year}",
      { team_key: `frc${teamNumber}`, media_tag: tag, year: String(year) },
      options
    ),
}) as const;
