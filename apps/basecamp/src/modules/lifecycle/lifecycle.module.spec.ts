import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { LifecycleCommands } from "./lifecycle.commands";
import { LifecycleModule } from "./lifecycle.module";
import { LifecycleService } from "./lifecycle.service";

describe("LifecycleModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [LifecycleModule],
    }).compile();
  });

  it("should compile successfully", () => {
    expect(module).toBeDefined();
  });

  it("should provide LifecycleService", () => {
    const service = module.get(LifecycleService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(LifecycleService);
  });

  it("should provide LifecycleCommands", () => {
    const commands = module.get(LifecycleCommands);
    expect(commands).toBeDefined();
    expect(commands).toBeInstanceOf(LifecycleCommands);
  });
});
