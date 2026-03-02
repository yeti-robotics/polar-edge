import { Test, type TestingModule } from "@nestjs/testing";
import { AppConfigService } from "src/config/config.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiService } from "./ai.service";

const { mockCreateGradientProvider } = vi.hoisted(() => ({
  mockCreateGradientProvider: vi.fn(),
}));

vi.mock("@repo/ai", () => ({
  createGradientProvider: mockCreateGradientProvider,
}));

describe("AiService", () => {
  let service: AiService;

  beforeEach(async () => {
    mockCreateGradientProvider.mockReturnValue({
      name: "gradient",
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: AppConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              switch (key) {
                case "doModelAccessKey":
                  return "test-api-key";
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  describe("getGradientProvider", () => {
    it("should return a gradient provider", () => {
      const provider = service.getGradientProvider();
      expect(provider).toBeDefined();
      expect(mockCreateGradientProvider).toHaveBeenCalledWith("test-api-key");
    });
  });
});
