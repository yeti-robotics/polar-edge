import * as z from "zod";

export const OutreachRecordSchema = z.object({
  date: z.string(),
  userName: z.string(),
  event: z.string(),
  eventType: z.string(),
  hours: z.coerce.number(),
});

export type OutreachRecord = z.infer<typeof OutreachRecordSchema>;
