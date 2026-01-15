import type { Fetcher } from "@/fetcher";
import type { FetcherOptions } from "@/fetcher/types";
import { matchesResource } from "@/resources/matches";
import type { MatchQueryFilters } from "./types";

type Match = Awaited<ReturnType<ReturnType<typeof matchesResource>["getEventMatches"]>>[number];

/**
 * Fluent query builder for match-related queries
 */
export class MatchQueryBuilder {
  private filters: MatchQueryFilters = {};

  constructor(
    private fetcher: Fetcher,
    private eventKey: string,
    private options: FetcherOptions = {}
  ) {}

  /**
   * Filter matches by competition level
   */
  where(filters: MatchQueryFilters) {
    this.filters = { ...this.filters, ...filters };
    return this;
  }

  /**
   * Execute the query and fetch matches
   */
  async fetch(options?: FetcherOptions): Promise<Match[]> {
    const matches = matchesResource(this.fetcher);

    // Get all matches for the event
    const allMatches = await matches.getEventMatches(this.eventKey, options ?? this.options);

    // Apply filters
    let filtered = allMatches;
    if (this.filters.compLevel) {
      filtered = filtered.filter((m) => m.comp_level === this.filters.compLevel);
    }
    if (this.filters.setNumber !== undefined) {
      filtered = filtered.filter((m) => m.set_number === this.filters.setNumber);
    }
    if (this.filters.matchNumber !== undefined) {
      filtered = filtered.filter((m) => m.match_number === this.filters.matchNumber);
    }

    // Note: includeBreakdowns and includeVideos are informational
    // The API already includes these fields, so we just return the filtered results
    return filtered;
  }

  /**
   * Get a single match by key
   */
  async getByKey(matchKey: string, options?: FetcherOptions) {
    const matches = matchesResource(this.fetcher);
    return matches.getByKey(matchKey, options ?? this.options);
  }
}
