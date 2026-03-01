import { Test, type TestingModule } from "@nestjs/testing";
import { AiService } from "src/lib/ai/ai.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HandbookModule } from "./handbook.module";
import { HandbookService } from "./handbook.service";

describe("HandbookModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [HandbookModule],
    })
      .overrideProvider(AiService)
      .useValue({
        getGradientProvider: vi.fn(() => (model: string) => ({
          provider: "gradient",
          modelId: model,
        })),
      })
      .compile();
  });

  it("should compile successfully", () => {
    expect(module).toBeDefined();
  });

  it("should export HandbookService", () => {
    const service = module.get(HandbookService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(HandbookService);
  });
});
