import { z } from "zod";

export const AttendanceRecordSchema = z.object({
  discordId: z.string(),
  team: z.string(),
  discordName: z.string(),
  date: z.string(),
  isSigningIn: z.boolean(),
});

export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;
