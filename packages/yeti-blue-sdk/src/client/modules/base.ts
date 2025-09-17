import { Cache, MemoryCache } from "@/cache";
import { Fetcher } from "@/fetcher";
import { FetcherOptions } from "@/fetcher/types";

export interface ModuleBaseConfig {
	apiKey: string;
	baseUrl: string;
	cache?: Cache<unknown>;
	defaultCache?: boolean;
}

export class ModuleBase {
	protected cache: Cache<unknown>;
	protected defaultCache: boolean;

	constructor({ cache, defaultCache }: ModuleBaseConfig) {
		this.cache = cache || new MemoryCache<unknown>(); // fallback to mem cache if not specified
		this.defaultCache = defaultCache ?? true;
	}

	private shouldCache(cache?: boolean) {
		return cache ?? this.defaultCache;
	}

	protected getFetcherOptions(options?: FetcherOptions) {
		return {
			cache: this.shouldCache(options?.cache),
		};
	}

	protected createFetcher(baseUrl: string, apiKey: string) {
		return new Fetcher(baseUrl, this.cache, {
			"X-TBA-Auth-Key": apiKey,
			"Content-Type": "application/json",
		});
	}
}
