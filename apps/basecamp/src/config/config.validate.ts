import { type Env, envSchema } from "./config.schema";

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse({
    discordToken: config.DISCORD_TOKEN,
    yetiServerId: config.YETI_SERVER_ID,
    devGuildId: config.DEV_GUILD_ID,
    adminRoleId: config.ADMIN_ROLE_ID,
    googleCredentials: config.GOOGLE_APPLICATION_CREDENTIALS,
    attendanceSpreadsheetId: config.ATTENDANCE_SPREADSHEET_ID,
    outreachSpreadsheetId: config.OUTREACH_SPREADSHEET_ID,
    doModelAccessKey: config.DO_MODEL_ACCESS_KEY,
    jwtSecret: config.JWT_SECRET,
    attendance2faSecret: config.ATTENDANCE_2FA_SECRET,
    attendance2faEnabled: config.ATTENDANCE_2FA_ENABLED,
  });

  if (!result.success) {
    throw new Error(`Environment validation failed:\n${result.error.toString()}`);
  }

  return result.data;
}
