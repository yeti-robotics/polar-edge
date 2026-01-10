import { z } from "zod";
import { ModuleBase, type ModuleBaseConfig } from "@/client/modules/base";
import type { Fetcher } from "@/fetcher";
import type { FetcherOptions } from "@/fetcher/types";
import { MatchSchema } from "@/schemas/match";

/**
 * @description A module for interacting with The Blue Alliance Team API
 *
 * @see https://www.thebluealliance.com/apidocs/v3
 */
export class MatchesResource extends ModuleBase {
  private fetcher: Fetcher;

  constructor(config: ModuleBaseConfig) {
    super(config);
    this.fetcher = this.createFetcher(config.baseUrl, config.apiKey);
  }

  private getYearFromEventKey(eventKey: string) {
    return Number.parseInt(eventKey.slice(0, 4), 10);
  }

  private injectYear(data: unknown) {
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid response from TBA");
    }
    if (!("event_key" in data) || typeof data.event_key !== "string") {
      throw new Error("Invalid response from TBA");
    }
    const year = this.getYearFromEventKey(data.event_key);
    return {
      ...data,
      year,
    };
  }

  async getEventMatchesSimple(eventKey: string, options?: FetcherOptions) {
    const res = await this.fetcher.fetch(
      `/event/${eventKey}/matches`,
      this.getFetcherOptions(options)
    );
    if (Array.isArray(res.data)) {
      return z.array(MatchSchema).parseAsync(res.data.map(this.injectYear.bind(this)));
    }
    throw new Error("Invalid response from TBA");
  }

  async getMatchByKey(matchKey: string, options?: FetcherOptions) {
    const res = await this.fetcher.fetch(`/match/${matchKey}`, this.getFetcherOptions(options));
    return MatchSchema.parseAsync(this.injectYear(res.data));
  }
}
