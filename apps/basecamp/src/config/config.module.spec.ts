import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "./config.schema";
import { AppConfigModule } from "./config.module";
import { AppConfigService } from "./config.service";

const { mockValidateEnv } = vi.hoisted(() => ({
  mockValidateEnv: vi.fn(),
}));

vi.mock("./config.validate", () => ({
  validateEnv: mockValidateEnv,
}));

const mockEnv: Env = {
  discordToken: "discord-token",
  yetiServerId: "yeti-server-id",
  devGuildId: "dev-guild-id",
  adminRoleId: "",
  googleCredentials: {
    client_email: "test@project.iam.gserviceaccount.com",
    private_key: "test-private-key",
  },
  attendanceSpreadsheetId: "attendance-id",
  outreachSpreadsheetId: "outreach-id",
  doModelAccessKey: "do-key",
  jwtSecret: "jwt-secret",
  attendance2faSecret: "2fa-secret",
  attendance2faEnabled: false,
};

describe("AppConfigModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    mockValidateEnv.mockReturnValue(mockEnv);

    module = await Test.createTestingModule({
      imports: [AppConfigModule],
    }).compile();
  });

  it("compiles successfully", () => {
    expect(module).toBeDefined();
  });

  it("provides and exports AppConfigService", () => {
    const service = module.get<AppConfigService>(AppConfigService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AppConfigService);
  });
});