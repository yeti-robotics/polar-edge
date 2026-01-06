import axios from "axios";
import type { Cache } from "@/cache";
import { Fetcher } from "@/fetcher";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Fetcher", () => {
  let mockCache: jest.Mocked<Cache<unknown>>;
  let fetcher: Fetcher;

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      delete: jest.fn(),
    };

    // Reset axios mock
    mockedAxios.create.mockReturnValue(mockedAxios);

    // Create fetcher instance
    fetcher = new Fetcher("https://api.example.com", mockCache);
  });

  it("should fetch data successfully without cache", async () => {
    const mockResponse = {
      data: { id: 1, name: "Test" },
      status: 200,
      headers: {
        etag: "abc123",
        "Cache-Control": "max-age=3600",
      },
    };

    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const result = await fetcher.fetch("/test");

    expect(result).toEqual({
      data: mockResponse.data,
      status: 200,
      etag: "abc123",
      maxAge: 3600,
    });
    expect(mockCache.set).not.toHaveBeenCalled();
  });

  it("should use cache when enabled and available", async () => {
    const cachedData = {
      value: { id: 1, name: "Cached" },
      metadata: {
        etag: "abc123",
        maxAge: 3600,
        timestamp: Date.now(),
      },
    };

    mockCache.get.mockResolvedValue(cachedData);

    // Mock 304 Not Modified response
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 304 },
    });
    mockedAxios.isAxiosError.mockReturnValueOnce(true);

    const result = await fetcher.fetch("/test", { cache: true });

    expect(result).toEqual({
      data: cachedData.value,
      status: 304,
      etag: cachedData.metadata.etag,
      maxAge: cachedData.metadata.maxAge,
    });
    expect(mockedAxios.get).toHaveBeenCalledWith("/test", {
      headers: { "If-None-Match": "abc123" },
    });
  });

  it("should cache new responses when cache is enabled", async () => {
    const mockResponse = {
      data: { id: 1, name: "Test" },
      status: 200,
      headers: {
        etag: "abc123",
        "Cache-Control": "max-age=3600",
      },
    };

    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    await fetcher.fetch("/test", { cache: true });

    expect(mockCache.set).toHaveBeenCalledWith("/test", {
      value: mockResponse.data,
      metadata: {
        etag: "abc123",
        maxAge: 3600,
        timestamp: expect.any(Number),
      },
    });
  });

  it("should handle missing Cache-Control header", async () => {
    const mockResponse = {
      data: { id: 1, name: "Test" },
      status: 200,
      headers: {
        etag: "abc123",
      },
    };

    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const result = await fetcher.fetch("/test");

    expect(result).toBeDefined();
    expect(result?.maxAge).toBeUndefined();
  });
});
