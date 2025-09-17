import { ModuleBase, ModuleBaseConfig } from "@/client/modules/base";
import { Fetcher } from "@/fetcher";
import { FetcherOptions } from "@/fetcher/types";
import { TeamSchema, TeamSimpleSchema } from "@/schemas/team";

/**
 * @description A module for interacting with The Blue Alliance Team API
 *
 * @see https://www.thebluealliance.com/apidocs/v3
 */
export class TeamsResource extends ModuleBase {
	private fetcher: Fetcher;

	constructor(config: ModuleBaseConfig) {
		super(config);
		this.fetcher = this.createFetcher(config.baseUrl, config.apiKey);
	}

	async getSimple(teamNumber: number, options?: FetcherOptions) {
		const res = await this.fetcher.fetch(
			`/team/frc${teamNumber}/simple`,
			this.getFetcherOptions(options)
		);
		return TeamSimpleSchema.parseAsync(res.data);
	}

	async get(teamNumber: number, options?: FetcherOptions) {
		const res = await this.fetcher.fetch(
			`/team/frc${teamNumber}`,
			this.getFetcherOptions(options)
		);
		return TeamSchema.parseAsync(res.data);
	}
}
