// making the schema with zod validation so bad CSV data never hits the db

import { z } from "zod";

export const MAX_CSV_BYTES = 256 * 1024;

export const manualEventSchema = z
  .object({
    eventCode: z.string().trim().min(1).max(16),
    name: z.string().trim().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((event) => event.endDate >= event.startDate, {
    message: "The end data cannot be before the start date. ",
    path: ["endDate"],
  });




export type ManualEventInput = z.input<typeof manualEventSchema>;
// export type MatchScheduleRow = z.infer<typeof matchScheduleRowSchema>;
