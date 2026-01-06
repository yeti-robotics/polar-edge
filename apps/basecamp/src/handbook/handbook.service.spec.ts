import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
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
            get: jest.fn(),
          },
        },
        {
          provide: AiService,
          useValue: {
            models: {
              getAiClient: jest.fn(),
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
