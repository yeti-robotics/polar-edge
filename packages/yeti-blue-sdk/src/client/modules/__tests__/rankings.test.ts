import axios, { type AxiosInstance } from "axios";
import { MemoryCache } from "@/cache";
import { YETIBlueClient } from "@/client";
import type { DistrictRanking, RegionalPoolRanking } from "@/schemas/rankings";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Modules - Rankings", () => {
  let client: YETIBlueClient;
  let cache: MemoryCache<unknown>;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;

  const mockDistrictRanking: DistrictRanking = {
    team_key: "frc3506",
    rank: 1,
    rookie_bonus: 0,
    point_total: 100,
    event_points: [
      {
        event_key: "2025test",
        district_cmp: false,
        alliance_points: 10,
        award_points: 5,
        qual_points: 20,
        elim_points: 15,
        total: 50,
      },
    ],
  };

  const mockRegionalPoolRanking: RegionalPoolRanking = {
    team_key: "frc3506",
    rank: 1,
    rookie_bonus: 0,
    point_total: 100,
    single_event_bonus: 10,
    event_points: [
      {
        event_key: "2025test",
        district_cmp: false,
        alliance_points: 10,
        award_points: 5,
        qual_points: 20,
        elim_points: 15,
        total: 50,
      },
    ],
  };

  beforeEach(() => {
    cache = new MemoryCache<unknown>();
    mockAxiosInstance = {
      get: jest.fn(),
    } as unknown as jest.Mocked<AxiosInstance>;
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    client = new YETIBlueClient({
      apiKey: "test",
      baseUrl: "",
      cache,
      defaultCache: true,
    });
  });

  it("gets district rankings", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      headers: {
        "Cache-Control": "max-age=3600",
        ETag: "1234567890",
      },
      data: [mockDistrictRanking],
    });

    const result = await client.rankings.getDistrictRanking("2025nc");
    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result?.[0]).toEqual(mockDistrictRanking);
  });

  it("gets regional pool rankings", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      headers: {
        "Cache-Control": "max-age=3600",
        ETag: "1234567890",
      },
      data: [mockRegionalPoolRanking],
    });

    const result = await client.rankings.getRegionalPoolRanking(2025);
    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result?.[0]).toEqual(mockRegionalPoolRanking);
  });

  it("checks cache before making API call for district rankings", async () => {
    const cacheSpy = jest.spyOn(cache, "get");
    cache.set("/district/2025nc/rankings", {
      value: [mockDistrictRanking],
      metadata: {
        etag: "1234567890",
        timestamp: Date.now(),
        maxAge: 3600,
      },
    });

    mockAxiosInstance.get.mockResolvedValue({
      data: [mockDistrictRanking],
      status: 200,
      headers: {
        "Cache-Control": "max-age=3600",
        etag: "1234567890",
      },
    });

    const result = await client.rankings.getDistrictRanking("2025nc", {
      cache: true,
    });

    expect(cacheSpy).toHaveBeenCalledWith("/district/2025nc/rankings");
    expect(result).toEqual([mockDistrictRanking]);
  });

  it("stores district rankings response in cache", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: [mockDistrictRanking],
      status: 200,
      headers: {
        "Cache-Control": "max-age=3600",
        etag: "1234567890",
      },
    });

    const cacheSpy = jest.spyOn(cache, "set");

    await client.rankings.getDistrictRanking("2025nc", { cache: true });

    expect(cacheSpy).toHaveBeenCalledWith("/district/2025nc/rankings", {
      value: [mockDistrictRanking],
      metadata: {
        etag: "1234567890",
        maxAge: 3600,
        timestamp: expect.any(Number),
      },
    });
  });

  it("handles null response for district rankings", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      headers: {
        "Cache-Control": "max-age=3600",
        ETag: "1234567890",
      },
      data: null,
    });

    const result = await client.rankings.getDistrictRanking("2025nc");
    expect(result).toBeNull();
  });

  it("handles null response for regional pool rankings", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      headers: {
        "Cache-Control": "max-age=3600",
        ETag: "1234567890",
      },
      data: null,
    });

    const result = await client.rankings.getRegionalPoolRanking(2025);
    expect(result).toBeNull();
  });
});
