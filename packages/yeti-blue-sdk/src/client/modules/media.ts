import { z } from "zod";
import { ModuleBase, type ModuleBaseConfig } from "@/client/modules/base";
import type { Fetcher } from "@/fetcher";
import type { FetcherOptions } from "@/fetcher/types";
import { MediaSchema } from "@/schemas";

/**
 * @description A module for interacting with The Blue Alliance Team API
 *
 * @see https://www.thebluealliance.com/apidocs/v3
 */
export class MediaResource extends ModuleBase {
  private fetcher: Fetcher;

  constructor(config: ModuleBaseConfig) {
    super(config);
    this.fetcher = this.createFetcher(config.baseUrl, config.apiKey);
  }

  async getTeamMediaForYear(teamNumber: number, year: number, options?: FetcherOptions) {
    const res = await this.fetcher.fetch(
      `/team/frc${teamNumber}/media/${year}`,
      this.getFetcherOptions(options)
    );
    return z.array(MediaSchema).parseAsync(res.data);
  }
}
