import type { Cache } from "@/cache/types";
import type { CachedResponse } from "@/fetcher/types";

interface CacheOptions {
  maxSizeBytes?: number;
}

export class MemoryCache<T> implements Cache<T> {
  private cache: Map<string, CachedResponse<T>>;
  private keySizes: Map<string, number>;
  private currentSizeBytes: number;
  private maxSizeBytes: number;
  private accessOrder: Map<string, number>; // Track last access time for eviction

  constructor(options: CacheOptions = {}) {
    this.cache = new Map<string, CachedResponse<T>>();
    this.keySizes = new Map<string, number>();
    this.currentSizeBytes = 0;
    this.maxSizeBytes = options.maxSizeBytes || Infinity;
    this.accessOrder = new Map<string, number>();
  }

  async get(key: string) {
    const cached = this.cache.get(key) as CachedResponse<T> | undefined;
    if (!cached) return null;

    if (cached.metadata.maxAge) {
      const age = Date.now() - cached.metadata.timestamp;
      if (age > cached.metadata.maxAge * 1000) {
        this.cache.delete(key);
        return null;
      }
    }

    // Just update the access time
    this.accessOrder.set(key, Date.now());
    return cached;
  }

  async set(key: string, value: CachedResponse<T>) {
    const size = this.calculateSize(value);

    if (size > this.maxSizeBytes) {
      return;
    }

    while (this.currentSizeBytes + size > this.maxSizeBytes) {
      this.evictLRU();
    }

    this.cache.set(key, value);
    this.keySizes.set(key, size);
    this.currentSizeBytes += size;
    this.accessOrder.set(key, Date.now());
  }

  async delete(key: string) {
    const size = this.keySizes.get(key) || 0;
    this.currentSizeBytes -= size;
    this.cache.delete(key);
    this.keySizes.delete(key);
    this.accessOrder.delete(key);
  }

  async clear() {
    this.cache.clear();
    this.keySizes.clear();
    this.accessOrder.clear();
    this.currentSizeBytes = 0;
  }

  private calculateSize(response: CachedResponse<unknown>): number {
    return Buffer.byteLength(JSON.stringify(response));
  }

  private evictLRU(): void {
    if (this.accessOrder.size === 0) return;

    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  getStats() {
    return {
      itemCount: this.cache.size,
      currentSizeBytes: this.currentSizeBytes,
      maxSizeBytes: this.maxSizeBytes,
      usagePercent: this.currentSizeBytes / this.maxSizeBytes,
    };
  }
}
