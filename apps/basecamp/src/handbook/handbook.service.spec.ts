import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiService } from "../ai/ai.service";
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
            get: vi.fn(),
          },
        },
        {
          provide: AiService,
          useValue: {
            models: {
              getAiClient: vi.fn(),
            },
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
