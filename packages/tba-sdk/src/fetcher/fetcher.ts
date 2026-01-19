import type { Cache, CacheEntry } from "@/cache";
import { TBAError, TBANetworkError, TBANotFoundError, TBARateLimitError } from "@/errors";
import type {
  ApiPath,
  FetcherOptions,
  FetcherResponse,
  GetResponseType,
  PathParams,
} from "@/fetcher/types";

/**
 * Resolve a path template with parameters.
 * e.g., resolvePath("/team/{team_key}", { team_key: "frc254" }) => "/team/frc254"
 */
function resolvePath<TPath extends string>(pathTemplate: TPath, params: PathParams<TPath>): string {
  let resolved: string = pathTemplate;
  for (const [key, value] of Object.entries(params)) {
    resolved = resolved.replace(`{${key}}`, value as string);
  }
  return resolved;
}

/**
 * Type-safe fetcher for The Blue Alliance API.
 * Uses path templates from the OpenAPI spec for full type inference.
 * Supports ETag-based caching when a Cache instance is provided.
 */
export class Fetcher {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private cache?: Cache;

  constructor(baseURL: string, defaultHeaders: Record<string, string> = {}, cache?: Cache) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
    this.cache = cache;
  }

  /**
   * Fetch data from the API with type-safe path and parameters.
   *
   * @param pathTemplate - API endpoint path template (e.g., "/team/{team_key}")
   * @param params - Path parameters (e.g., { team_key: "frc254" })
   * @param options - Fetcher options
   * @returns Typed response data
   *
   * @example
   * ```ts
   * // Type-safe: params and return type are inferred from path
   * const team = await fetcher.get("/team/{team_key}", { team_key: "frc254" });
   * ```
   */
  async get<TPath extends ApiPath>(
    pathTemplate: TPath,
    params: PathParams<TPath>,
    options?: FetcherOptions
  ): Promise<GetResponseType<TPath>> {
    const response = await this.fetch(pathTemplate, params, options);
    return response.data;
  }

  /**
   * Low-level fetch method that returns response with metadata.
   * Supports ETag-based caching when a cache is configured.
   */
  async fetch<TPath extends ApiPath>(
    pathTemplate: TPath,
    params: PathParams<TPath>,
    options: FetcherOptions = {}
  ): Promise<FetcherResponse<TPath>> {
    const resolvedPath = resolvePath(pathTemplate, params);
    const cacheKey = `GET:${resolvedPath}`;

    // Try to get cached entry for ETag
    let cachedEntry: CacheEntry<GetResponseType<TPath>> | undefined;
    if (this.cache && !options.skipCache) {
      cachedEntry = this.cache.get<GetResponseType<TPath>>(cacheKey);
    }

    // Build request headers
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
    };

    // Use explicit etag from options, or fall back to cached etag
    const etag = options.etag ?? cachedEntry?.etag;
    if (etag) {
      headers["If-None-Match"] = etag;
    }

    try {
      const url = `${this.baseURL}${resolvedPath}`;
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      // Handle 304 Not Modified - return cached data
      if (response.status === 304 && cachedEntry) {
        return {
          data: cachedEntry.data,
          status: 304,
          etag: cachedEntry.etag,
          maxAge: cachedEntry.maxAge,
          fromCache: true,
        };
      }

      // Handle error status codes
      if (!response.ok) {
        const body = await response.text().catch(() => undefined);
        await this.handleErrorResponse(response.status, resolvedPath, body);
      }

      // Parse response - type comes from the path template
      const data: GetResponseType<TPath> = await response.json();
      const responseEtag = response.headers.get("etag") ?? undefined;
      const cacheControl = response.headers.get("cache-control") ?? undefined;
      const maxAge = this.parseMaxAge(cacheControl);

      // Store in cache if we have a cache and an etag
      if (this.cache && responseEtag) {
        this.cache.set<GetResponseType<TPath>>(cacheKey, {
          data,
          etag: responseEtag,
          cachedAt: Date.now(),
          maxAge,
        });
      }

      return {
        data,
        status: response.status,
        etag: responseEtag,
        maxAge,
        fromCache: false,
      };
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new TBANetworkError(resolvedPath, error);
      }

      // Re-throw our custom errors
      if (error instanceof TBAError || error instanceof TBANetworkError) {
        throw error;
      }

      // Wrap unexpected errors
      if (error instanceof Error) {
        throw new TBANetworkError(resolvedPath, error);
      }
      // Fallback for non-Error values
      throw new TBANetworkError(resolvedPath, new Error(String(error)));
    }
  }

  private async handleErrorResponse(
    status: number,
    endpoint: string,
    body?: string
  ): Promise<never> {
    let parsedBody: unknown;
    try {
      parsedBody = body ? JSON.parse(body) : undefined;
    } catch {
      parsedBody = body;
    }

    switch (status) {
      case 404:
        throw new TBANotFoundError(endpoint, parsedBody);
      case 429:
        throw new TBARateLimitError(endpoint, parsedBody);
      default:
        throw new TBAError(status, endpoint, parsedBody);
    }
  }

  private parseMaxAge(cacheControl?: string): number | undefined {
    if (!cacheControl) return undefined;
    const match = cacheControl.match(/max-age=(\d+)/);
    return match ? Number.parseInt(match[1], 10) : undefined;
  }
}
