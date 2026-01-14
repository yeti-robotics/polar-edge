/** Time after which a "forgot to sign out" gets auto-resolved (3.5 hours) */
export const STALE_SIGNIN_THRESHOLD_MS = 1000 * 60 * 60 * 3.5;

/** Default credit given when user forgot to sign out (1.5 hours) */
export const FORGOT_SIGNOUT_CREDIT_MS = 1000 * 60 * 60 * 1.5;

/** Time after which a sign-out attempt becomes a new sign-in (18 hours) */
export const EXPIRED_SESSION_THRESHOLD_MS = 1000 * 60 * 60 * 18;

/** Milliseconds per hour for calculations */
export const MS_PER_HOUR = 1000 * 60 * 60;

/** Google Sheets configuration */
export const SHEET_NAME = "Attendance";
export const SHEET_RANGE_APPEND = "Attendance!A:D";
export const SHEET_RANGE_READ = "Attendance!A:E";

/** Column indices in the attendance sheet */
export const COLUMN_INDICES = {
  DISCORD_ID: 0,
  TEAM: 1,
  DISCORD_NAME: 2,
  DATE: 3,
  IS_SIGNING_IN: 4,
} as const;

/** Column names in order */
export const COLUMN_NAMES = ["discordId", "team", "discordName", "date", "isSigningIn"] as const;

/** Team name mappings */
export const TEAM_NAMES = {
  YETI_ROBOTICS: "YETI Robotics",
  DEV: "Dev",
} as const;

/** Boolean string values used in sheets */
export const BOOLEAN_STRINGS = {
  TRUE: "true",
  TRUE_UPPERCASE: "TRUE",
} as const;

/** Default limit for leaderboard queries */
export const DEFAULT_LEADERBOARD_LIMIT = 5;
