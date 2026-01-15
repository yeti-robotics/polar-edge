import type { Fetcher } from "@/fetcher";
import type { FetcherOptions } from "@/fetcher/types";
import { eventsResource } from "@/resources/events";
import { matchesResource } from "@/resources/matches";
import { rankingsResource } from "@/resources/rankings";

/**
 * Fluent query builder for event-related queries
 */
export class EventQueryBuilder {
  constructor(
    private fetcher: Fetcher,
    private eventKey: string,
    private options: FetcherOptions = {}
  ) {}

  /**
   * Query matches for this event
   */
  matches() {
    const matches = matchesResource(this.fetcher);
    return matches.getEventMatches(this.eventKey, this.options);
  }

  /**
   * Get event information
   */
  async get(options?: FetcherOptions) {
    const events = eventsResource(this.fetcher);
    return events.get(this.eventKey, options ?? this.options);
  }

  /**
   * Get simple event information
   */
  async getSimple(options?: FetcherOptions) {
    const events = eventsResource(this.fetcher);
    return events.getSimple(this.eventKey, options ?? this.options);
  }

  /**
   * Get teams for this event
   */
  async getTeams(options?: FetcherOptions) {
    const events = eventsResource(this.fetcher);
    return events.getTeams(this.eventKey, options ?? this.options);
  }

  /**
   * Get rankings for this event
   */
  async getRankings(options?: FetcherOptions) {
    const rankings = rankingsResource(this.fetcher);
    return rankings.getEventRankings(this.eventKey, options ?? this.options);
  }

  /**
   * Get awards for this event
   */
  async getAwards(options?: FetcherOptions) {
    const events = eventsResource(this.fetcher);
    return events.getAwards(this.eventKey, options ?? this.options);
  }
}
