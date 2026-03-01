import { z } from "zod";

export const AttendanceRecordSchema = z.object({
  discordId: z.string().min(1),
  team: z.string(),
  discordName: z.string(),
  date: z.string(),
  isSigningIn: z.preprocess((v) => {
    if (v === "true" || v === "TRUE") return true;
    if (v === "false" || v === "FALSE") return false;
    return v;
  }, z.boolean()),
});

export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;
