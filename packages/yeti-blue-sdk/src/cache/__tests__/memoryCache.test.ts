import { CachedResponse } from "../../fetcher/types";
import { MemoryCache } from "../memoryCache";

const delay = (callback: () => unknown | Promise<unknown>, ms: number) =>
	new Promise((resolve) =>
		setTimeout(() => {
			Promise.resolve(callback()).then(() => resolve(true));
		}, ms)
	);

describe("MemoryCache", () => {
	let cache: MemoryCache<string>;

	beforeEach(() => {
		cache = new MemoryCache<string>();
	});

	describe("basic operations", () => {
		it("should set and get values", async () => {
			const value: CachedResponse<string> = {
				value: "test",
				metadata: {
					timestamp: Date.now(),
					maxAge: 3600,
				},
			};

			await cache.set("key1", value);
			const result = await cache.get("key1");
			expect(result).toEqual(value);
		});

		it("should return null for non-existent keys", async () => {
			const result = await cache.get("nonexistent");
			expect(result).toBeNull();
		});

		it("should delete values", async () => {
			const value: CachedResponse<string> = {
				value: "test",
				metadata: {
					timestamp: Date.now(),
					maxAge: 3600,
				},
			};

			await cache.set("key1", value);
			await cache.delete("key1");
			const result = await cache.get("key1");
			expect(result).toBeNull();
		});

		it("should clear all values", async () => {
			const value: CachedResponse<string> = {
				value: "test",
				metadata: {
					timestamp: Date.now(),
					maxAge: 3600,
				},
			};

			await cache.set("key1", value);
			await cache.set("key2", value);
			await cache.clear();

			expect(await cache.get("key1")).toBeNull();
			expect(await cache.get("key2")).toBeNull();
		});
	});

	describe("expiration", () => {
		it("should expire items after maxAge", async () => {
			const value: CachedResponse<string> = {
				value: "test",
				metadata: {
					timestamp: Date.now() - 7200000, // 2 hours ago
					maxAge: 3600, // 1 hour
				},
			};

			await cache.set("key1", value);
			const result = await cache.get("key1");
			expect(result).toBeNull();
		});

		it("should not expire items before maxAge", async () => {
			const value: CachedResponse<string> = {
				value: "test",
				metadata: {
					timestamp: Date.now(),
					maxAge: 3600,
				},
			};

			await cache.set("key1", value);
			const result = await cache.get("key1");
			expect(result).toEqual(value);
		});
	});

	describe("size limits", () => {
		it("should respect maxSizeBytes limit", async () => {
			const smallCache = new MemoryCache<string>({ maxSizeBytes: 100 });

			const value1: CachedResponse<string> = {
				value: "test1",
				metadata: {
					timestamp: Date.now(),
					maxAge: 3600,
				},
			};

			const value2: CachedResponse<string> = {
				value: "test2",
				metadata: {
					timestamp: Date.now(),
					maxAge: 3600,
				},
			};

			await smallCache.set("key1", value1);
			await smallCache.set("key2", value2);

			// First value should be evicted due to size limit
			expect(await smallCache.get("key1")).toBeNull();
			expect(await smallCache.get("key2")).toEqual(value2);
		});

		it("should not store items larger than maxSizeBytes", async () => {
			const smallCache = new MemoryCache<string>({ maxSizeBytes: 10 });

			const largeValue: CachedResponse<string> = {
				value: "this is a very large string that exceeds the cache size limit",
				metadata: {
					timestamp: Date.now(),
					maxAge: 3600,
				},
			};

			await smallCache.set("key1", largeValue);
			expect(await smallCache.get("key1")).toBeNull();
		});
	});

	describe("LRU eviction", () => {
		it("should evict least recently used items when size limit is reached", async () => {
			const smallCache = new MemoryCache<string>({ maxSizeBytes: 256 });

			const value: CachedResponse<string> = {
				value: "test",
				metadata: {
					timestamp: Date.now(),
					maxAge: 3600,
				},
			};

			/*
      Two items with the same timestamp will be evicted in undefined order.
      To prevent flaky tests, we add a delay between each operation.
      */
			await smallCache.set("key1", value);
			await delay(() => smallCache.set("key2", value), 1);
			await delay(() => smallCache.set("key3", value), 1);
			// Access key1 to make it most recently used
			await delay(() => smallCache.get("key1"), 1);
			await delay(() => smallCache.set("key4", value), 1);

			// key2 should be evicted as it was least recently used
			expect(await smallCache.get("key2")).toBeNull();
			expect(await smallCache.get("key1")).toEqual(value);
			expect(await smallCache.get("key3")).toEqual(value);
			expect(await smallCache.get("key4")).toEqual(value);
		});
	});

	describe("stats", () => {
		it("should return correct cache statistics", async () => {
			const smallCache = new MemoryCache<string>({ maxSizeBytes: 256 });
			const value: CachedResponse<string> = {
				value: "test",
				metadata: {
					timestamp: Date.now(),
					maxAge: 3600,
				},
			};

			await smallCache.set("key1", value);
			await smallCache.set("key2", value);
			await smallCache.set("key3", value);
			await smallCache.set("key4", value);

			const stats = smallCache.getStats();
			expect(stats.itemCount).toBe(3);
			expect(stats.currentSizeBytes).toBeGreaterThan(0);
			expect(stats.maxSizeBytes).toBe(256);
			expect(stats.usagePercent).toBeLessThanOrEqual(1);
			expect(stats.usagePercent).toBeGreaterThanOrEqual(0);
		});
	});
});
