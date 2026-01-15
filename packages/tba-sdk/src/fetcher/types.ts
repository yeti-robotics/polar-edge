import type { paths } from "@/generated";

/**
 * All valid API paths from the OpenAPI spec
 */
export type ApiPath = keyof paths;

/**
 * Extract the response type for a given path from OpenAPI types
 */
type PathResponseType<TPath extends keyof paths> = paths[TPath] extends {
  get: { responses: { 200: { content: { "application/json": infer T } } } };
}
  ? T
  : paths[TPath] extends { get: infer Op }
    ? Op extends { responses: { 200: { content: { "application/json": infer T } } } }
      ? T
      : never
    : never;

/**
 * Get the response type for a specific API path
 */
export type GetResponseType<TPath extends ApiPath> = PathResponseType<TPath>;

/**
 * Extract path parameters from a path template.
 * e.g., "/team/{team_key}" -> { team_key: string }
 */
export type PathParams<TPath extends string> =
  TPath extends `${string}{${infer Param}}${infer Rest}`
    ? { [K in Param]: string } & PathParams<Rest>
    : Record<never, never>;

/**
 * Options for fetch requests
 */
export interface FetcherOptions {
  /** ETag for conditional requests (overrides cached ETag if provided) */
  etag?: string;
  /** Skip cache lookup and always fetch fresh data */
  skipCache?: boolean;
}

/**
 * Response from the fetcher including metadata
 */
export interface FetcherResponse<TPath extends ApiPath> {
  data: GetResponseType<TPath>;
  status: number;
  etag?: string;
  maxAge?: number;
  /** Whether the response was served from cache (304 Not Modified) */
  fromCache?: boolean;
}
