import type { Fetcher } from "@/fetcher";
import type { FetcherOptions, GetResponseType } from "@/fetcher/types";

type Match = GetResponseType<"/match/{match_key}"> & { year: number };
type MatchSimple = GetResponseType<"/event/{event_key}/matches/simple">[number] & { year: number };

/**
 * Functional resource for The Blue Alliance Matches API.
 * All methods are fully type-safe - path parameters and return types are inferred.
 *
 * @see https://www.thebluealliance.com/apidocs/v3
 */
export const matchesResource = (fetcher: Fetcher) => {
  const getYearFromEventKey = (eventKey: string): number => {
    return Number.parseInt(eventKey.slice(0, 4), 10);
  };

  const injectYear = <T extends { event_key: string }>(data: T): T & { year: number } => {
    const year = getYearFromEventKey(data.event_key);
    return { ...data, year };
  };

  return {
    /**
     * Get a match by its key
     */
    getByKey: async (matchKey: string, options?: FetcherOptions): Promise<Match> => {
      const match = await fetcher.get("/match/{match_key}", { match_key: matchKey }, options);
      return injectYear(match);
    },

    /**
     * Get all matches for an event
     */
    getEventMatches: async (eventKey: string, options?: FetcherOptions): Promise<Match[]> => {
      const matches = await fetcher.get(
        "/event/{event_key}/matches",
        { event_key: eventKey },
        options
      );
      return matches.map(injectYear);
    },

    /**
     * Get all matches for an event (simple)
     */
    getEventMatchesSimple: async (
      eventKey: string,
      options?: FetcherOptions
    ): Promise<MatchSimple[]> => {
      const matches = await fetcher.get(
        "/event/{event_key}/matches/simple",
        { event_key: eventKey },
        options
      );
      return matches.map(injectYear);
    },

    /**
     * Get matches for a specific team at an event
     */
    getTeamEventMatches: (teamNumber: number, eventKey: string, options?: FetcherOptions) =>
      fetcher.get(
        "/team/{team_key}/event/{event_key}/matches",
        { team_key: `frc${teamNumber}`, event_key: eventKey },
        options
      ),

    /**
     * Get matches for a specific team at an event (simple)
     */
    getTeamEventMatchesSimple: (teamNumber: number, eventKey: string, options?: FetcherOptions) =>
      fetcher.get(
        "/team/{team_key}/event/{event_key}/matches/simple",
        { team_key: `frc${teamNumber}`, event_key: eventKey },
        options
      ),
  } as const;
};
