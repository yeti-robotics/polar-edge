import type { LogLevel } from "@nestjs/common";
import * as z from "zod";

const LOG_LEVELS = ["fatal", "error", "warn", "log", "verbose", "debug"] as const satisfies LogLevel[];

export const envSchema = z.object({
  // Discord
  discordToken: z.string().min(1),
  yetiServerId: z.string().min(1),
  devGuildId: z.string().min(1).optional(),
  adminRoleId: z.string().default(""),

  // Google Sheets
  googleCredentials: z
    .base64()
    .transform((base64) => JSON.parse(Buffer.from(base64, "base64").toString("utf-8")))
    .pipe(
      z.object({
        client_email: z.string().min(1),
        private_key: z.string().min(1),
      })
    ),
  attendanceSpreadsheetId: z.string().min(1),
  outreachSpreadsheetId: z.string().min(1),

  // AI
  doModelAccessKey: z.string().min(1),

  // Auth
  jwtSecret: z.string().min(1),
  totpSecret: z.string().min(1),
  attendance2faPassword: z.string().min(1),
  attendance2faEnabled: z.coerce.boolean().default(false),

  // Logging
  logLevel: z.enum(LOG_LEVELS).default("log"),
});

export type Env = z.infer<typeof envSchema>;
