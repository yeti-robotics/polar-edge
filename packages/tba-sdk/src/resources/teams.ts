import type { Fetcher } from "@/fetcher";
import type { FetcherOptions } from "@/fetcher/types";

/**
 * Functional resource for The Blue Alliance Teams API.
 * All methods are fully type-safe - path parameters and return types are inferred.
 *
 * @see https://www.thebluealliance.com/apidocs/v3
 */
export const teamsResource = (fetcher: Fetcher) =>
  ({
    /**
     * Get detailed team information
     */
    get: (teamNumber: number, options?: FetcherOptions) =>
      fetcher.get("/team/{team_key}", { team_key: `frc${teamNumber}` }, options),

    /**
     * Get simple team information
     */
    getSimple: (teamNumber: number, options?: FetcherOptions) =>
      fetcher.get("/team/{team_key}/simple", { team_key: `frc${teamNumber}` }, options),

    /**
     * Get years a team has participated
     */
    getYearsParticipated: (teamNumber: number, options?: FetcherOptions) =>
      fetcher.get("/team/{team_key}/years_participated", { team_key: `frc${teamNumber}` }, options),

    /**
     * Get all team events
     */
    getEvents: (teamNumber: number, options?: FetcherOptions) =>
      fetcher.get("/team/{team_key}/events", { team_key: `frc${teamNumber}` }, options),

    /**
     * Get team events for a specific year
     */
    getEventsByYear: (teamNumber: number, year: number, options?: FetcherOptions) =>
      fetcher.get(
        "/team/{team_key}/events/{year}",
        { team_key: `frc${teamNumber}`, year: String(year) },
        options
      ),

    /**
     * Get all team events (simple)
     */
    getEventsSimple: (teamNumber: number, options?: FetcherOptions) =>
      fetcher.get("/team/{team_key}/events/simple", { team_key: `frc${teamNumber}` }, options),

    /**
     * Get team events for a specific year (simple)
     */
    getEventsByYearSimple: (teamNumber: number, year: number, options?: FetcherOptions) =>
      fetcher.get(
        "/team/{team_key}/events/{year}/simple",
        { team_key: `frc${teamNumber}`, year: String(year) },
        options
      ),

    /**
     * Get team matches for a specific event
     */
    getEventMatches: (teamNumber: number, eventKey: string, options?: FetcherOptions) =>
      fetcher.get(
        "/team/{team_key}/event/{event_key}/matches",
        { team_key: `frc${teamNumber}`, event_key: eventKey },
        options
      ),

    /**
     * Get team matches for a specific event (simple)
     */
    getEventMatchesSimple: (teamNumber: number, eventKey: string, options?: FetcherOptions) =>
      fetcher.get(
        "/team/{team_key}/event/{event_key}/matches/simple",
        { team_key: `frc${teamNumber}`, event_key: eventKey },
        options
      ),

    /**
     * Get all team awards
     */
    getAwards: (teamNumber: number, options?: FetcherOptions) =>
      fetcher.get("/team/{team_key}/awards", { team_key: `frc${teamNumber}` }, options),

    /**
     * Get team awards for a specific year
     */
    getAwardsByYear: (teamNumber: number, year: number, options?: FetcherOptions) =>
      fetcher.get(
        "/team/{team_key}/awards/{year}",
        { team_key: `frc${teamNumber}`, year: String(year) },
        options
      ),
  }) as const;
