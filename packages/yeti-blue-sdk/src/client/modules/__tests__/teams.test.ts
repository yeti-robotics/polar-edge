import axios, { type AxiosInstance } from "axios";
import { MemoryCache } from "../../../cache/memoryCache";
import type { Team, TeamSimple } from "../../../schemas";
import { YETIBlueClient } from "../../yetiBlue";

const teamSimple = {
  city: "Charlotte",
  country: "USA",
  key: "frc3506",
  name: "WCP/Gerdau/Frontier Capital/BASF/Microsoft/Ortho Carolina/Van Buren Law, PLLC/D.R.Joseph Incorporated/Piedmont Natural Gas/Pester/Mariner USA&Queen City Robotics Alliance",
  team_number: 3506,
  nickname: "YETI Robotics",
  state_prov: "NC",
} satisfies TeamSimple;

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Modules - Teams", () => {
  let client: YETIBlueClient;
  let cache: MemoryCache<unknown>;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;

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

  it("gets a simple team", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      headers: {
        "Cache-Control": "max-age=3600",
        ETag: "1234567890",
      },
      data: teamSimple,
    });
    const result = await client.teams.getSimple(3506);
    expect(result).toBeDefined();
  });

  it("gets a full team", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      headers: {
        "Cache-Control": "max-age=3600",
        ETag: "1234567890",
      },
      data: {
        address: null,
        city: "Charlotte",
        country: "USA",
        gmaps_place_id: null,
        gmaps_url: null,
        key: "frc3506",
        lat: null,
        lng: null,
        location_name: null,
        motto: null,
        name: "WCP/Gerdau/Frontier Capital/BASF/Microsoft/Ortho Carolina/Van Buren Law, PLLC/D.R.Joseph Incorporated/Piedmont Natural Gas/Pester/Mariner USA&Queen City Robotics Alliance",
        nickname: "YETI Robotics",
        postal_code: "28208",
        rookie_year: 2011,
        school_name: "Queen City Robotics Alliance",
        state_prov: "North Carolina",
        team_number: 3506,
        website: "http://www.yetirobotics.org",
      } satisfies Team,
    });
    const result = await client.teams.get(3506);
    expect(result).toBeDefined();
  });

  it("checks cache before making API call for simple team", async () => {
    // Setup cache spy
    const cacheSpy = jest.spyOn(cache, "get");
    cache.set("/team/frc3506/simple", {
      value: teamSimple,
      metadata: {
        etag: "1234567890",
        timestamp: Date.now(),
        maxAge: 3600,
      },
    });

    mockAxiosInstance.get.mockResolvedValue({
      data: teamSimple,
      status: 200,
      headers: {
        "Cache-Control": "max-age=3600",
        etag: "1234567890",
      },
    });

    const result = await client.teams.getSimple(3506, { cache: true });

    expect(cacheSpy).toHaveBeenCalledWith("/team/frc3506/simple");
    expect(result).toEqual(teamSimple);
  });

  it("stores simple team response in cache", async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: teamSimple,
      status: 200,
      headers: {
        "Cache-Control": "max-age=3600",
        etag: "1234567890",
      },
    });

    const cacheSpy = jest.spyOn(cache, "set");

    await client.teams.getSimple(3506, { cache: true });

    expect(cacheSpy).toHaveBeenCalledWith("/team/frc3506/simple", {
      value: teamSimple,
      metadata: {
        etag: "1234567890",
        maxAge: 3600,
        timestamp: expect.any(Number),
      },
    });
  });
});
