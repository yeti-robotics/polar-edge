/**
 * A cached response entry containing the data and metadata for ETag-based caching.
 */
export interface CacheEntry<T = unknown> {
  /** The cached response data */
  data: T;
  /** The ETag value from the response */
  etag: string;
  /** Timestamp when the entry was cached (ms since epoch) */
  cachedAt: number;
  /** Max-age from Cache-Control header (seconds) */
  maxAge?: number;
}

/**
 * Cache interface for storing API responses with ETag support.
 * Implementations can use different storage backends (memory, Redis, etc.)
 */
export interface Cache {
  /**
   * Get a cached entry by key.
   * @param key - The cache key (typically the request URL)
   * @returns The cached entry or undefined if not found/expired
   */
  get<T = unknown>(key: string): CacheEntry<T> | undefined;

  /**
   * Store a response in the cache.
   * @param key - The cache key (typically the request URL)
   * @param entry - The cache entry to store
   */
  set<T = unknown>(key: string, entry: CacheEntry<T>): void;

  /**
   * Remove an entry from the cache.
   * @param key - The cache key to remove
   */
  delete(key: string): void;

  /**
   * Clear all entries from the cache.
   */
  clear(): void;

  /**
   * Get the number of entries currently in the cache.
   */
  size(): number;
}

/**
 * Configuration options for the memory cache.
 */
export interface MemoryCacheOptions {
  /**
   * Maximum number of entries to store in the cache.
   * When exceeded, least recently used entries are evicted.
   * @default 500
   */
  max?: number;

  /**
   * Default TTL in milliseconds for entries without a maxAge.
   * Set to 0 or undefined to disable default TTL.
   * @default 60000 (1 minute)
   */
  defaultTTL?: number;
}
