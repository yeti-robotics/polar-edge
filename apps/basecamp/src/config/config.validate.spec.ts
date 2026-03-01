import { describe, expect, it } from "vitest";
import { envSchema } from "./config.schema";
import { validateEnv } from "./config.validate";

function encodeCredentials(creds: object): string {
  return Buffer.from(JSON.stringify(creds)).toString("base64");
}

const validGoogleCreds = encodeCredentials({
  client_email: "test@project.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
});

const validConfig = {
  discordToken: "discord-token",
  yetiServerId: "yeti-server-id",
  devGuildId: "dev-guild-id",
  adminRoleId: "admin-role-id",
  googleCredentials: validGoogleCreds,
  attendanceSpreadsheetId: "attendance-sheet-id",
  outreachSpreadsheetId: "outreach-sheet-id",
  doModelAccessKey: "do-model-key",
  jwtSecret: "jwt-secret",
  attendance2faSecret: "2fa-secret",
  attendance2faEnabled: false,
};

describe("envSchema", () => {
  describe("valid config", () => {
    it("parses a fully specified valid config", () => {
      const result = envSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it("decodes googleCredentials from base64 and parses the JSON", () => {
      const result = envSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.googleCredentials).toEqual({
          client_email: "test@project.iam.gserviceaccount.com",
          private_key: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        });
      }
    });

    it("defaults adminRoleId to empty string when omitted", () => {
      const { adminRoleId: _, ...rest } = validConfig;
      const result = envSchema.safeParse(rest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.adminRoleId).toBe("");
      }
    });

    it("defaults attendance2faEnabled to false when omitted", () => {
      const { attendance2faEnabled: _, ...rest } = validConfig;
      const result = envSchema.safeParse(rest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attendance2faEnabled).toBe(false);
      }
    });

    it("accepts attendance2faEnabled as true", () => {
      const result = envSchema.safeParse({ ...validConfig, attendance2faEnabled: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attendance2faEnabled).toBe(true);
      }
    });
  });

  describe("required string fields", () => {
    const requiredFields = [
      "discordToken",
      "yetiServerId",
      "devGuildId",
      "attendanceSpreadsheetId",
      "outreachSpreadsheetId",
      "doModelAccessKey",
      "jwtSecret",
      "attendance2faSecret",
    ] as const;

    it.each(requiredFields)("fails when %s is missing", (field) => {
      const config = { ...validConfig } as Record<string, unknown>;
      delete config[field];
      expect(envSchema.safeParse(config).success).toBe(false);
    });

    it.each(requiredFields)("fails when %s is an empty string", (field) => {
      expect(envSchema.safeParse({ ...validConfig, [field]: "" }).success).toBe(false);
    });
  });

  describe("googleCredentials", () => {
    it("fails when googleCredentials is missing", () => {
      const { googleCredentials: _, ...rest } = validConfig;
      expect(envSchema.safeParse(rest).success).toBe(false);
    });

    it("fails when googleCredentials is not valid base64", () => {
      expect(
        envSchema.safeParse({ ...validConfig, googleCredentials: "not-base64!!!" }).success
      ).toBe(false);
    });

    it("throws when googleCredentials decodes to non-JSON", () => {
      // JSON.parse inside the .transform() throws and escapes safeParse in Zod v4
      const notJson = Buffer.from("not valid json").toString("base64");
      expect(() => envSchema.safeParse({ ...validConfig, googleCredentials: notJson })).toThrow(
        SyntaxError
      );
    });

    it("fails when googleCredentials is missing client_email", () => {
      const creds = encodeCredentials({ private_key: "test-key" });
      expect(envSchema.safeParse({ ...validConfig, googleCredentials: creds }).success).toBe(false);
    });

    it("fails when googleCredentials is missing private_key", () => {
      const creds = encodeCredentials({ client_email: "test@test.com" });
      expect(envSchema.safeParse({ ...validConfig, googleCredentials: creds }).success).toBe(false);
    });

    it("fails when client_email is an empty string", () => {
      const creds = encodeCredentials({ client_email: "", private_key: "test-key" });
      expect(envSchema.safeParse({ ...validConfig, googleCredentials: creds }).success).toBe(false);
    });

    it("fails when private_key is an empty string", () => {
      const creds = encodeCredentials({ client_email: "test@test.com", private_key: "" });
      expect(envSchema.safeParse({ ...validConfig, googleCredentials: creds }).success).toBe(false);
    });
  });
});

describe("validateEnv", () => {
  const validRawEnv = {
    DISCORD_TOKEN: "discord-token",
    YETI_SERVER_ID: "yeti-server-id",
    DEV_GUILD_ID: "dev-guild-id",
    ADMIN_ROLE_ID: "admin-role-id",
    GOOGLE_APPLICATION_CREDENTIALS: validGoogleCreds,
    ATTENDANCE_SPREADSHEET_ID: "attendance-sheet-id",
    OUTREACH_SPREADSHEET_ID: "outreach-sheet-id",
    DO_MODEL_ACCESS_KEY: "do-model-key",
    JWT_SECRET: "jwt-secret",
    ATTENDANCE_2FA_SECRET: "2fa-secret",
    ATTENDANCE_2FA_ENABLED: "false",
  };

  it("returns the parsed env on a valid config", () => {
    const result = validateEnv(validRawEnv);
    expect(result.discordToken).toBe("discord-token");
    expect(result.yetiServerId).toBe("yeti-server-id");
    expect(result.jwtSecret).toBe("jwt-secret");
  });

  it("throws when the config is invalid", () => {
    expect(() => validateEnv({})).toThrow("Environment validation failed:");
  });

  it("includes schema error details in the thrown message", () => {
    expect(() => validateEnv({ DISCORD_TOKEN: "" })).toThrow("Environment validation failed:");
  });
});
