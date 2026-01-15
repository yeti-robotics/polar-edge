import { EventQueryBuilder } from "@/builders/event-builder";
import { TeamQueryBuilder } from "@/builders/team-builder";
import { type Cache, MemoryCache, type MemoryCacheOptions } from "@/cache";
import { Fetcher } from "@/fetcher";
import { eventsResource } from "@/resources/events";
import { matchesResource } from "@/resources/matches";
import { mediaResource } from "@/resources/media";
import { rankingsResource } from "@/resources/rankings";
import { teamsResource } from "@/resources/teams";

/**
 * Configuration for creating a TBA client
 */
export interface TBAClientConfig {
  /** TBA API key (required) */
  apiKey: string;
  /** Base URL for TBA API (defaults to v3 API) */
  baseUrl?: string;
  /**
   * Cache configuration. Options:
   * - `true` (default): Use built-in memory cache with default settings
   * - `false`: Disable caching entirely
   * - `MemoryCacheOptions`: Use built-in memory cache with custom settings
   * - `Cache`: Provide a custom cache implementation
   */
  cache?: boolean | MemoryCacheOptions | Cache;
}

/**
 * Check if value is a Cache implementation (has required methods)
 */
function isCache(value: unknown): value is Cache {
  return (
    typeof value === "object" &&
    value !== null &&
    "get" in value &&
    "set" in value &&
    "delete" in value &&
    "clear" in value &&
    typeof (value as Cache).get === "function" &&
    typeof (value as Cache).set === "function"
  );
}

/**
 * Creates a new TBA API client with functional resource methods.
 * All API methods are fully type-safe - path parameters and return types are inferred from the OpenAPI spec.
 *
 * @example
 * ```ts
 * const tba = createTBAClient({ apiKey: process.env.TBA_KEY });
 * const team = await tba.teams.get(3506);
 * const matches = await tba.event('2024ncwak').matches().where({ compLevel: 'qm' }).fetch();
 * ```
 *
 * @example
 * ```ts
 * // Disable caching
 * const tba = createTBAClient({ apiKey: process.env.TBA_KEY, cache: false });
 *
 * // Custom cache settings
 * const tba = createTBAClient({
 *   apiKey: process.env.TBA_KEY,
 *   cache: { max: 1000, defaultTTL: 120000 }
 * });
 * ```
 */
export function createTBAClient(config: TBAClientConfig) {
  const baseUrl = config.baseUrl ?? "https://www.thebluealliance.com/api/v3";
  const defaultHeaders = {
    "X-TBA-Auth-Key": config.apiKey,
    "Content-Type": "application/json",
  };

  // Initialize cache based on config
  let cache: Cache | undefined;
  const cacheConfig = config.cache ?? true; // Default to enabled

  if (cacheConfig === true) {
    cache = new MemoryCache();
  } else if (cacheConfig === false) {
    cache = undefined;
  } else if (isCache(cacheConfig)) {
    cache = cacheConfig;
  } else {
    // MemoryCacheOptions
    cache = new MemoryCache(cacheConfig);
  }

  const fetcher = new Fetcher(baseUrl, defaultHeaders, cache);

  return {
    /**
     * Direct resource access
     */
    teams: teamsResource(fetcher),
    events: eventsResource(fetcher),
    matches: matchesResource(fetcher),
    rankings: rankingsResource(fetcher),
    media: mediaResource(fetcher),

    /**
     * Fluent query builder entry points
     */
    team: (number: number) => new TeamQueryBuilder(fetcher, number),
    event: (key: string) => new EventQueryBuilder(fetcher, key),

    /**
     * Access to the cache instance for manual cache operations.
     * Returns undefined if caching is disabled.
     */
    cache,
  } as const;
}

/**
 * Type of the TBA client returned by createTBAClient
 */
export type TBAClient = ReturnType<typeof createTBAClient>;
