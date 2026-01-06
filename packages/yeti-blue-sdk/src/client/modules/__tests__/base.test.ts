import { MemoryCache } from "@/cache";
import { ModuleBase, type ModuleBaseConfig } from "@/client/modules/base";
import { Fetcher } from "@/fetcher";

// Type to expose protected members for testing
type TestableModuleBase = ModuleBase & {
  cache: MemoryCache<unknown>;
  defaultCache: boolean;
  createFetcher: (baseUrl: string, apiKey: string) => Fetcher;
  getFetcherOptions: (options: { cache?: boolean }) => { cache: boolean };
};

describe("ModuleBase", () => {
  let moduleBase: TestableModuleBase;
  let config: ModuleBaseConfig;
  let cache: MemoryCache<unknown>;

  beforeEach(() => {
    cache = new MemoryCache<unknown>();
    config = {
      apiKey: "test-key",
      baseUrl: "https://api.example.com",
      cache,
      defaultCache: true,
    };
    moduleBase = new ModuleBase(config) as TestableModuleBase;
  });

  it("initializes with provided cache", () => {
    expect(moduleBase).toBeInstanceOf(ModuleBase);
    expect(moduleBase.cache).toBe(cache);
    expect(moduleBase.defaultCache).toBe(true);
  });

  it("initializes with default memory cache when none provided", () => {
    const configWithoutCache: ModuleBaseConfig = {
      apiKey: "test-key",
      baseUrl: "https://api.example.com",
    };
    const module = new ModuleBase(configWithoutCache) as TestableModuleBase;
    expect(module.cache).toBeInstanceOf(MemoryCache);
  });

  it("sets defaultCache to true when not specified", () => {
    const configWithoutDefaultCache: ModuleBaseConfig = {
      apiKey: "test-key",
      baseUrl: "https://api.example.com",
      cache,
    };
    const module = new ModuleBase(configWithoutDefaultCache) as TestableModuleBase;
    expect(module.defaultCache).toBe(true);
  });

  it("sets defaultCache to false when specified", () => {
    const configWithDefaultCacheFalse: ModuleBaseConfig = {
      apiKey: "test-key",
      baseUrl: "https://api.example.com",
      cache,
      defaultCache: false,
    };
    const module = new ModuleBase(configWithDefaultCacheFalse) as TestableModuleBase;
    expect(module.defaultCache).toBe(false);
  });

  it("creates fetcher with correct configuration", () => {
    const fetcher = moduleBase.createFetcher(config.baseUrl, config.apiKey);
    expect(fetcher).toBeInstanceOf(Fetcher);
  });

  it("returns correct fetcher options when cache is true", () => {
    const options = moduleBase.getFetcherOptions({ cache: true });
    expect(options).toEqual({ cache: true });
  });

  it("returns correct fetcher options when cache is false", () => {
    const options = moduleBase.getFetcherOptions({ cache: false });
    expect(options).toEqual({ cache: false });
  });

  it("uses defaultCache when cache option is not provided", () => {
    const options = moduleBase.getFetcherOptions({});
    expect(options).toEqual({ cache: true });
  });

  it("uses provided cache setting over defaultCache", () => {
    const options = moduleBase.getFetcherOptions({ cache: false });
    expect(options).toEqual({ cache: false });
  });
});
