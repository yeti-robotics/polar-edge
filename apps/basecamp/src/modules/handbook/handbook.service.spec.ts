import { Test, type TestingModule } from "@nestjs/testing";
import { AiService } from "src/lib/ai/ai.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HandbookService } from "./handbook.service";

const generateTextMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    text: "The answer is 42.",
    usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    finishReason: "stop",
  })
);

vi.mock("ai", () => ({
  generateText: generateTextMock,
}));

vi.mock("src/modules/handbook/handbook.prompt", () => ({
  handbookPrompt: "You are a helpful assistant that answers questions about the handbook.",
}));

describe("HandbookService", () => {
  let service: HandbookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandbookService,
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

  describe("askHandbookQuestion", () => {
    it("calls generateText and returns text, usage, and finish reason", async () => {
      const result = await service.askHandbookQuestion("What is the meaning of life?");

      expect(generateTextMock).toHaveBeenCalledWith({
        model: {
          provider: "gradient",
          modelId: "openai-gpt-oss-20b",
        },
        system: "You are a helpful assistant that answers questions about the handbook.",
        prompt: "What is the meaning of life?",
        maxOutputTokens: 500,
        temperature: 0.2,
      });

      expect(result.text).toBe("The answer is 42.");
      expect(result.usage).toBeDefined();
      expect(result.finishReason).toBe("stop");
    });
  });
});
