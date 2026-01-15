import { MemoryCache } from "@/cache";
import { TBAError, TBANetworkError, TBANotFoundError, TBARateLimitError } from "@/errors";
import { Fetcher } from "@/fetcher";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Fetcher", () => {
  let fetcher: Fetcher;
  const baseURL = "https://www.thebluealliance.com/api/v3";

  beforeEach(() => {
    mockFetch.mockReset();
    fetcher = new Fetcher(baseURL, { "X-TBA-Auth-Key": "test-key" });
  });

  describe("constructor", () => {
    it("should create a fetcher with baseURL and headers", () => {
      const f = new Fetcher("https://api.example.com", { Authorization: "Bearer token" });
      expect(f).toBeInstanceOf(Fetcher);
    });

    it("should create a fetcher with default empty headers", () => {
      const f = new Fetcher("https://api.example.com");
      expect(f).toBeInstanceOf(Fetcher);
    });
  });

  describe("get()", () => {
    it("should fetch and return data directly", async () => {
      const mockTeam = { key: "frc254", nickname: "The Cheesy Poofs" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTeam,
        headers: new Headers({ etag: '"abc123"' }),
      });

      const result = await fetcher.get("/team/{team_key}", { team_key: "frc254" });

      expect(result).toEqual(mockTeam);
      expect(mockFetch).toHaveBeenCalledWith(`${baseURL}/team/frc254`, {
        method: "GET",
        headers: { "X-TBA-Auth-Key": "test-key" },
      });
    });

    it("should resolve path parameters correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
        headers: new Headers(),
      });

      await fetcher.get("/team/{team_key}/events/{year}", {
        team_key: "frc1678",
        year: "2024",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseURL}/team/frc1678/events/2024`,
        expect.any(Object)
      );
    });
  });

  describe("fetch()", () => {
    it("should return response with metadata", async () => {
      const mockData = { key: "frc254" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers({
          etag: '"abc123"',
          "cache-control": "max-age=3600",
        }),
      });

      const result = await fetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      expect(result).toEqual({
        data: mockData,
        status: 200,
        etag: '"abc123"',
        maxAge: 3600,
        fromCache: false,
      });
    });

    it("should send If-None-Match header when etag is provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Headers(),
      });

      await fetcher.fetch("/team/{team_key}", { team_key: "frc254" }, { etag: '"cached-etag"' });

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        method: "GET",
        headers: {
          "X-TBA-Auth-Key": "test-key",
          "If-None-Match": '"cached-etag"',
        },
      });
    });

    it("should handle missing cache-control header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ key: "frc254" }),
        headers: new Headers({ etag: '"abc123"' }),
      });

      const result = await fetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      expect(result.maxAge).toBeUndefined();
    });

    it("should handle missing etag header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ key: "frc254" }),
        headers: new Headers({ "cache-control": "max-age=300" }),
      });

      const result = await fetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      expect(result.etag).toBeUndefined();
      expect(result.maxAge).toBe(300);
    });
  });

  describe("error handling", () => {
    it("should throw TBANotFoundError on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ Error: "Team not found" }),
        headers: new Headers(),
      });

      await expect(fetcher.get("/team/{team_key}", { team_key: "frc99999" })).rejects.toThrow(
        TBANotFoundError
      );
    });

    it("should throw TBARateLimitError on 429", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({ Error: "Rate limit exceeded" }),
        headers: new Headers(),
      });

      await expect(fetcher.get("/team/{team_key}", { team_key: "frc254" })).rejects.toThrow(
        TBARateLimitError
      );
    });

    it("should throw TBAError on other HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
        headers: new Headers(),
      });

      await expect(fetcher.get("/team/{team_key}", { team_key: "frc254" })).rejects.toThrow(
        TBAError
      );
    });

    it("should include endpoint and status in error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ Error: "Not found" }),
        headers: new Headers(),
      });

      try {
        await fetcher.get("/team/{team_key}", { team_key: "frc99999" });
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TBANotFoundError);
        expect((error as TBANotFoundError).status).toBe(404);
        expect((error as TBANotFoundError).endpoint).toBe("/team/frc99999");
      }
    });

    it("should throw TBANetworkError on network failure", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));

      await expect(fetcher.get("/team/{team_key}", { team_key: "frc254" })).rejects.toThrow(
        TBANetworkError
      );
    });

    it("should handle non-JSON error response body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Plain text error",
        headers: new Headers(),
      });

      try {
        await fetcher.get("/team/{team_key}", { team_key: "frc254" });
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TBAError);
        expect((error as TBAError).body).toBe("Plain text error");
      }
    });
  });

  describe("cache-control parsing", () => {
    it("should parse max-age from cache-control header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Headers({ "cache-control": "public, max-age=7200" }),
      });

      const result = await fetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      expect(result.maxAge).toBe(7200);
    });

    it("should handle cache-control without max-age", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Headers({ "cache-control": "no-cache" }),
      });

      const result = await fetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      expect(result.maxAge).toBeUndefined();
    });
  });

  describe("cache integration", () => {
    let cache: MemoryCache;
    let cachedFetcher: Fetcher;

    beforeEach(() => {
      cache = new MemoryCache();
      cachedFetcher = new Fetcher(baseURL, { "X-TBA-Auth-Key": "test-key" }, cache);
    });

    it("should store responses in cache when etag is present", async () => {
      const mockData = { key: "frc254", nickname: "The Cheesy Poofs" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers({
          etag: '"abc123"',
          "cache-control": "max-age=60",
        }),
      });

      await cachedFetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      const cached = cache.get("GET:/team/frc254");
      expect(cached).toBeDefined();
      expect(cached?.data).toEqual(mockData);
      expect(cached?.etag).toBe('"abc123"');
      expect(cached?.maxAge).toBe(60);
    });

    it("should not store responses in cache when etag is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ key: "frc254" }),
        headers: new Headers(),
      });

      await cachedFetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      const cached = cache.get("GET:/team/frc254");
      expect(cached).toBeUndefined();
    });

    it("should use cached etag for If-None-Match header", async () => {
      // First request - populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ key: "frc254" }),
        headers: new Headers({ etag: '"cached-etag"' }),
      });

      await cachedFetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      // Second request - should use cached etag
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ key: "frc254" }),
        headers: new Headers({ etag: '"new-etag"' }),
      });

      await cachedFetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), {
        method: "GET",
        headers: {
          "X-TBA-Auth-Key": "test-key",
          "If-None-Match": '"cached-etag"',
        },
      });
    });

    it("should handle 304 Not Modified and return cached data", async () => {
      // First request - populate cache
      const mockData = { key: "frc254", nickname: "The Cheesy Poofs" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers({
          etag: '"abc123"',
          "cache-control": "max-age=60",
        }),
      });

      const firstResult = await cachedFetcher.fetch("/team/{team_key}", { team_key: "frc254" });
      expect(firstResult.fromCache).toBe(false);

      // Second request - server returns 304
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 304,
        headers: new Headers(),
      });

      const secondResult = await cachedFetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      expect(secondResult.status).toBe(304);
      expect(secondResult.fromCache).toBe(true);
      expect(secondResult.data).toEqual(mockData);
      expect(secondResult.etag).toBe('"abc123"');
    });

    it("should prefer explicit etag over cached etag", async () => {
      // Populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ key: "frc254" }),
        headers: new Headers({ etag: '"cached-etag"' }),
      });

      await cachedFetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      // Request with explicit etag
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ key: "frc254" }),
        headers: new Headers({ etag: '"new-etag"' }),
      });

      await cachedFetcher.fetch(
        "/team/{team_key}",
        { team_key: "frc254" },
        { etag: '"explicit-etag"' }
      );

      expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), {
        method: "GET",
        headers: {
          "X-TBA-Auth-Key": "test-key",
          "If-None-Match": '"explicit-etag"',
        },
      });
    });

    it("should skip cache lookup when skipCache is true", async () => {
      // Populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ key: "frc254", version: 1 }),
        headers: new Headers({ etag: '"v1"' }),
      });

      await cachedFetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      // Request with skipCache
      const freshData = { key: "frc254", version: 2 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => freshData,
        headers: new Headers({ etag: '"v2"' }),
      });

      const result = await cachedFetcher.fetch(
        "/team/{team_key}",
        { team_key: "frc254" },
        { skipCache: true }
      );

      // Should not send If-None-Match header
      expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), {
        method: "GET",
        headers: { "X-TBA-Auth-Key": "test-key" },
      });

      expect(result.data).toEqual(freshData);
    });

    it("should work without cache", async () => {
      // Fetcher without cache
      const noCacheFetcher = new Fetcher(baseURL, { "X-TBA-Auth-Key": "test-key" });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ key: "frc254" }),
        headers: new Headers({ etag: '"abc"' }),
      });

      const result = await noCacheFetcher.fetch("/team/{team_key}", { team_key: "frc254" });

      expect(result.data).toEqual({ key: "frc254" });
      expect(result.fromCache).toBe(false);
    });
  });
});
