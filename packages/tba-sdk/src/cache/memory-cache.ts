import { LRUCache } from "lru-cache";
import type { Cache, CacheEntry, MemoryCacheOptions } from "./types";

/**
 * Default maximum number of cache entries
 */
const DEFAULT_MAX_ENTRIES = 500;

/**
 * Default TTL in milliseconds (1 minute)
 */
const DEFAULT_TTL_MS = 60_000;

/**
 * In-memory LRU cache implementation for storing API responses with ETag support.
 *
 * Uses lru-cache under the hood for efficient LRU eviction and TTL handling.
 *
 * @example
 * ```ts
 * const cache = new MemoryCache({ max: 1000 });
 * cache.set("/team/frc254", { data: team, etag: "abc123", cachedAt: Date.now() });
 * const entry = cache.get("/team/frc254");
 * ```
 */
export class MemoryCache implements Cache {
  private cache: LRUCache<string, CacheEntry>;
  private defaultTTL: number;

  constructor(options: MemoryCacheOptions = {}) {
    const max = options.max ?? DEFAULT_MAX_ENTRIES;
    this.defaultTTL = options.defaultTTL ?? DEFAULT_TTL_MS;

    this.cache = new LRUCache<string, CacheEntry>({
      max,
      // TTL is set per-entry in the set() method
      ttl: this.defaultTTL,
      // Update age on get to keep frequently accessed items fresh
      updateAgeOnGet: true,
    });
  }

  get<T = unknown>(key: string): CacheEntry<T> | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }
    return entry as CacheEntry<T>;
  }

  set<T = unknown>(key: string, entry: CacheEntry<T>): void {
    // Calculate TTL from maxAge if available, otherwise use default
    const ttl = entry.maxAge ? entry.maxAge * 1000 : this.defaultTTL;

    this.cache.set(key, entry as CacheEntry, {
      ttl: ttl > 0 ? ttl : undefined,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
