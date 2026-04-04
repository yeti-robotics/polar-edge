import { z } from "zod";

export const SCOUTING_ROLE_OPTIONS = [
  "Red 1 Scout",
  "Red 2 Scout",
  "Red 3 Scout",
  "Blue 1 Scout",
  "Blue 2 Scout",
  "Blue 3 Scout",
] as const;

export const SHIFT_OPTIONS = [
  "Pit Scouting",
  "Qualification Match Scouting",
] as const;

export const ShiftScheduleEntrySchema = z.object({
  id: z.string().min(1),
  memberId: z.string().min(1).nullable().optional().default(null),
  name: z.string().max(120).optional().default(""),
  email: z.string().max(320).optional().nullable().default(null),
  role: z.string().max(120).optional().default(""),
  shift: z.string().max(120).optional().default(""),
  notes: z.string().max(240).optional().nullable(),
});

export const ShiftSchedulePayloadSchema = z.object({
  entries: z.array(ShiftScheduleEntrySchema).max(200),
});

export type ShiftScheduleEntry = z.infer<typeof ShiftScheduleEntrySchema>;
export type ShiftSchedulePayload = z.infer<typeof ShiftSchedulePayloadSchema>;

export function normalizeShiftScheduleEntries(payload: unknown): ShiftScheduleEntry[] {
  const parsed = z.array(ShiftScheduleEntrySchema).safeParse(payload);
  return parsed.success ? parsed.data : [];
}
