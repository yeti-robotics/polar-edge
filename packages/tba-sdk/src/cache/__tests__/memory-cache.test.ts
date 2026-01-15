import { MemoryCache } from "../memory-cache";
import type { CacheEntry } from "../types";

describe("MemoryCache", () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  describe("constructor", () => {
    it("should create a cache with default options", () => {
      const c = new MemoryCache();
      expect(c.size()).toBe(0);
    });

    it("should create a cache with custom options", () => {
      const c = new MemoryCache({ max: 100, defaultTTL: 30000 });
      expect(c.size()).toBe(0);
    });
  });

  describe("get/set", () => {
    it("should store and retrieve entries", () => {
      const entry: CacheEntry<{ name: string }> = {
        data: { name: "test" },
        etag: '"abc123"',
        cachedAt: Date.now(),
      };

      cache.set("key1", entry);
      const result = cache.get<{ name: string }>("key1");

      expect(result).toEqual(entry);
    });

    it("should return undefined for missing keys", () => {
      const result = cache.get("nonexistent");
      expect(result).toBeUndefined();
    });

    it("should overwrite existing entries", () => {
      const entry1: CacheEntry = {
        data: { version: 1 },
        etag: '"v1"',
        cachedAt: Date.now(),
      };
      const entry2: CacheEntry = {
        data: { version: 2 },
        etag: '"v2"',
        cachedAt: Date.now(),
      };

      cache.set("key", entry1);
      cache.set("key", entry2);

      const result = cache.get("key");
      expect(result?.data).toEqual({ version: 2 });
      expect(result?.etag).toBe('"v2"');
    });
  });

  describe("delete", () => {
    it("should remove entries", () => {
      const entry: CacheEntry = {
        data: { test: true },
        etag: '"etag"',
        cachedAt: Date.now(),
      };

      cache.set("key", entry);
      expect(cache.get("key")).toBeDefined();

      cache.delete("key");
      expect(cache.get("key")).toBeUndefined();
    });

    it("should handle deleting nonexistent keys", () => {
      // Should not throw
      cache.delete("nonexistent");
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      cache.set("key1", { data: 1, etag: '"1"', cachedAt: Date.now() });
      cache.set("key2", { data: 2, etag: '"2"', cachedAt: Date.now() });
      cache.set("key3", { data: 3, etag: '"3"', cachedAt: Date.now() });

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get("key1")).toBeUndefined();
    });
  });

  describe("size", () => {
    it("should return the number of entries", () => {
      expect(cache.size()).toBe(0);

      cache.set("key1", { data: 1, etag: '"1"', cachedAt: Date.now() });
      expect(cache.size()).toBe(1);

      cache.set("key2", { data: 2, etag: '"2"', cachedAt: Date.now() });
      expect(cache.size()).toBe(2);

      cache.delete("key1");
      expect(cache.size()).toBe(1);
    });
  });

  describe("LRU eviction", () => {
    it("should evict least recently used entries when max is reached", () => {
      const smallCache = new MemoryCache({ max: 3 });

      smallCache.set("a", { data: "a", etag: '"a"', cachedAt: Date.now() });
      smallCache.set("b", { data: "b", etag: '"b"', cachedAt: Date.now() });
      smallCache.set("c", { data: "c", etag: '"c"', cachedAt: Date.now() });

      expect(smallCache.size()).toBe(3);

      // Access 'a' to make it recently used
      smallCache.get("a");

      // Add a new entry - should evict 'b' (least recently used)
      smallCache.set("d", { data: "d", etag: '"d"', cachedAt: Date.now() });

      expect(smallCache.size()).toBe(3);
      expect(smallCache.get("a")).toBeDefined();
      expect(smallCache.get("b")).toBeUndefined();
      expect(smallCache.get("c")).toBeDefined();
      expect(smallCache.get("d")).toBeDefined();
    });
  });

  describe("TTL handling", () => {
    it("should use maxAge from entry for TTL", () => {
      // Entry with 1 second maxAge
      const entry: CacheEntry = {
        data: { test: true },
        etag: '"etag"',
        cachedAt: Date.now(),
        maxAge: 1, // 1 second
      };

      cache.set("key", entry);
      expect(cache.get("key")).toBeDefined();
    });

    it("should use default TTL when maxAge is not provided", () => {
      const entry: CacheEntry = {
        data: { test: true },
        etag: '"etag"',
        cachedAt: Date.now(),
        // No maxAge
      };

      cache.set("key", entry);
      expect(cache.get("key")).toBeDefined();
    });
  });
});
