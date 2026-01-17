import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { AiService } from "src/ai/ai.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HandbookService } from "./handbook.service";

describe("HandbookService", () => {
  let service: HandbookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandbookService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              if (key === "DO_MODEL_ID") return "test-model-id";
              return undefined;
            }),
          },
        },
        {
          provide: AiService,
          useValue: {
            getGradientProvider: vi.fn(() => (model: string) => ({
              provider: "gradient",
              modelId: model,
            })),
          },
        },
      ],
    }).compile();

    service = module.get<HandbookService>(HandbookService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
