import type { Fetcher } from "@/fetcher";
import type { FetcherOptions } from "@/fetcher/types";
import { mediaResource } from "@/resources/media";
import { teamsResource } from "@/resources/teams";

/**
 * Fluent query builder for team-related queries
 */
export class TeamQueryBuilder {
  constructor(
    private fetcher: Fetcher,
    private teamNumber: number,
    private options: FetcherOptions = {}
  ) {}

  /**
   * Get team information
   */
  async get(options?: FetcherOptions) {
    const teams = teamsResource(this.fetcher);
    return teams.get(this.teamNumber, options ?? this.options);
  }

  /**
   * Get simple team information
   */
  async getSimple(options?: FetcherOptions) {
    const teams = teamsResource(this.fetcher);
    return teams.getSimple(this.teamNumber, options ?? this.options);
  }

  /**
   * Get team events for a specific year
   */
  async getEvents(year?: number, options?: FetcherOptions) {
    const teams = teamsResource(this.fetcher);
    if (year) {
      return teams.getEventsByYear(this.teamNumber, year, options ?? this.options);
    }
    return teams.getEvents(this.teamNumber, options ?? this.options);
  }

  /**
   * Get team matches for a specific event
   */
  async getMatches(eventKey: string, options?: FetcherOptions) {
    const teams = teamsResource(this.fetcher);
    return teams.getEventMatches(this.teamNumber, eventKey, options ?? this.options);
  }

  /**
   * Get team awards
   */
  async getAwards(year?: number, options?: FetcherOptions) {
    const teams = teamsResource(this.fetcher);
    if (year) {
      return teams.getAwardsByYear(this.teamNumber, year, options ?? this.options);
    }
    return teams.getAwards(this.teamNumber, options ?? this.options);
  }

  /**
   * Get team media for a specific year
   */
  async getMedia(year: number, options?: FetcherOptions) {
    const media = mediaResource(this.fetcher);
    return media.getTeamMediaForYear(this.teamNumber, year, options ?? this.options);
  }

  /**
   * Get team media for a specific tag
   */
  async getMediaByTag(tag: string, options?: FetcherOptions) {
    const media = mediaResource(this.fetcher);
    return media.getTeamMediaByTag(this.teamNumber, tag, options ?? this.options);
  }

  /**
   * Get team media for a specific tag and year
   */
  async getMediaByTagAndYear(tag: string, year: number, options?: FetcherOptions) {
    const media = mediaResource(this.fetcher);
    return media.getTeamMediaByTagAndYear(this.teamNumber, tag, year, options ?? this.options);
  }
}
