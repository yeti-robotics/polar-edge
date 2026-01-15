import type { Fetcher } from "@/fetcher";
import type { FetcherOptions } from "@/fetcher/types";

/**
 * Functional resource for The Blue Alliance Events API.
 * All methods are fully type-safe - path parameters and return types are inferred.
 *
 * @see https://www.thebluealliance.com/apidocs/v3
 */
export const eventsResource = (fetcher: Fetcher) =>
  ({
    /**
     * Get event information
     */
    get: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}", { event_key: eventKey }, options),

    /**
     * Get simple event information
     */
    getSimple: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/simple", { event_key: eventKey }, options),

    /**
     * Get all events for a year
     */
    getByYear: (year: number, options?: FetcherOptions) =>
      fetcher.get("/events/{year}", { year: String(year) }, options),

    /**
     * Get all events for a year (simple)
     */
    getByYearSimple: (year: number, options?: FetcherOptions) =>
      fetcher.get("/events/{year}/simple", { year: String(year) }, options),

    /**
     * Get event teams
     */
    getTeams: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/teams", { event_key: eventKey }, options),

    /**
     * Get event teams (simple)
     */
    getTeamsSimple: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/teams/simple", { event_key: eventKey }, options),

    /**
     * Get event awards
     */
    getAwards: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/awards", { event_key: eventKey }, options),

    /**
     * Get event alliances
     */
    getAlliances: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/alliances", { event_key: eventKey }, options),

    /**
     * Get event district points
     */
    getDistrictPoints: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/district_points", { event_key: eventKey }, options),

    /**
     * Get event insights
     */
    getInsights: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/insights", { event_key: eventKey }, options),

    /**
     * Get event OPRs, DPRs, and CCWMs
     */
    getOPRs: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/oprs", { event_key: eventKey }, options),

    /**
     * Get event predictions
     */
    getPredictions: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/predictions", { event_key: eventKey }, options),

    /**
     * Get event matches
     */
    getMatches: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/matches", { event_key: eventKey }, options),

    /**
     * Get event matches (simple)
     */
    getMatchesSimple: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/matches/simple", { event_key: eventKey }, options),

    /**
     * Get event rankings
     */
    getRankings: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/rankings", { event_key: eventKey }, options),
  }) as const;
