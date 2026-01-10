import { z } from "zod";
import { ModuleBase, type ModuleBaseConfig } from "@/client/modules/base";
import type { Fetcher } from "@/fetcher";
import type { FetcherOptions } from "@/fetcher/types";
import {
  DistrictRankingSchema,
  EventRankingsSchema,
  RegionalPoolRankingSchema,
} from "@/schemas/rankings";

/**
 * @description A module for interacting with The Blue Alliance Team API
 *
 * @see https://www.thebluealliance.com/apidocs/v3
 */
/**
 * Retrieves the event rankings for a specified event key.
 *
 * @param eventKey - The unique identifier for the event (TBA event key).
 * @param options - Optional fetcher options to customize the request.
 * @returns A promise that resolves to an array of event rankings
 *          or `null` if no data is available.
 * @throws Will throw an error if the response data cannot be parsed
 *         according to the `EventRankingsSchema`.
 */
export class RankingResource extends ModuleBase {
  private fetcher: Fetcher;

  constructor(config: ModuleBaseConfig) {
    super(config);
    this.fetcher = this.createFetcher(config.baseUrl, config.apiKey);
  }

  async getDistrictRanking(districtKey: string, options?: FetcherOptions) {
    const res = await this.fetcher.fetch(
      `/district/${districtKey}/rankings`,
      this.getFetcherOptions(options)
    );
    return z.array(DistrictRankingSchema).nullable().parseAsync(res.data);
  }

  /**
   * Retrieves the regional pool rankings for a specified year.
   *
   * @param year - The year for which the regional pool rankings are to be fetched.
   * @param options - Optional fetcher options to customize the request.
   * @returns A promise that resolves to an array of regional pool rankings
   *          or `null` if no data is available.
   * @throws Will throw an error if the response data cannot be parsed
   *         according to the `RegionalPoolRankingSchema`.
   */
  async getRegionalPoolRanking(year: number, options?: FetcherOptions) {
    const res = await this.fetcher.fetch(
      `/regional_advancements/${year}/rankings`,
      this.getFetcherOptions(options)
    );
    return z.array(RegionalPoolRankingSchema).nullable().parseAsync(res.data);
  }

  /**
   * Gets the event rankings for a given event key
   * @param eventKey - TBA event key
   * @param options - fetcher options
   * @returns
   */
  async getEventRanking(eventKey: number, options?: FetcherOptions) {
    const res = await this.fetcher.fetch(
      `/event/${eventKey}/rankings`,
      this.getFetcherOptions(options)
    );
    return z.array(EventRankingsSchema).nullable().parseAsync(res.data);
  }
}
