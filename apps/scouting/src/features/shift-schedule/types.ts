import { z } from "zod";

export const ShiftScheduleEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().max(120).optional().default(""),
  role: z.string().max(120).optional().default(""),
  shift: z.string().max(120).optional().default(""),
  notes: z.string().max(240).optional().nullable(),
});

export const ShiftSchedulePayloadSchema = z.object({
  entries: z.array(ShiftScheduleEntrySchema),
});

export type ShiftScheduleEntry = z.infer<typeof ShiftScheduleEntrySchema>;
export type ShiftSchedulePayload = z.infer<typeof ShiftSchedulePayloadSchema>;
