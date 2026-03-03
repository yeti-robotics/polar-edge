import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";
import { HealthModule } from "./health.module";

describe("HealthModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();
  });

  it("should compile successfully", () => {
    expect(module).toBeDefined();
  });

  it("should provide HealthController", () => {
    const controller = module.get(HealthController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(HealthController);
  });
});
