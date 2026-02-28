import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppConfigService } from "./config.service";

describe("AppConfigService", () => {
  let service: AppConfigService;
  let mockConfigService: { get: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockConfigService = { get: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AppConfigService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
  });

  describe("get", () => {
    it("delegates to ConfigService with { infer: true }", () => {
      mockConfigService.get.mockReturnValue("discord-token");
      const result = service.get("discordToken");
      expect(mockConfigService.get).toHaveBeenCalledWith("discordToken", { infer: true });
      expect(result).toBe("discord-token");
    });

    it("returns the value from the underlying ConfigService", () => {
      mockConfigService.get.mockReturnValue("my-secret");
      expect(service.get("jwtSecret")).toBe("my-secret");
    });

    it("returns the parsed googleCredentials object", () => {
      const creds = { client_email: "test@test.com", private_key: "key" };
      mockConfigService.get.mockReturnValue(creds);
      expect(service.get("googleCredentials")).toEqual(creds);
    });
  });
});
