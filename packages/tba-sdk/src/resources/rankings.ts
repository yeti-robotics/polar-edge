import type { Fetcher } from "@/fetcher";
import type { FetcherOptions } from "@/fetcher/types";

/**
 * Functional resource for The Blue Alliance Rankings API.
 * All methods are fully type-safe - path parameters and return types are inferred.
 *
 * @see https://www.thebluealliance.com/apidocs/v3
 */
export const rankingsResource = (fetcher: Fetcher) =>
  ({
    /**
     * Get district rankings
     */
    getDistrictRankings: (districtKey: string, options?: FetcherOptions) =>
      fetcher.get("/district/{district_key}/rankings", { district_key: districtKey }, options),

    /**
     * Get regional pool rankings for a year
     */
    getRegionalRankings: (year: number, options?: FetcherOptions) =>
      fetcher.get("/regional_advancement/{year}/rankings", { year: String(year) }, options),

    /**
     * Get event rankings
     */
    getEventRankings: (eventKey: string, options?: FetcherOptions) =>
      fetcher.get("/event/{event_key}/rankings", { event_key: eventKey }, options),
  }) as const;
