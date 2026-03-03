import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get(HealthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("health (GET /health)", () => {
    it("returns status ok", () => {
      expect(controller.health()).toEqual({ status: "ok" });
    });
  });
});
