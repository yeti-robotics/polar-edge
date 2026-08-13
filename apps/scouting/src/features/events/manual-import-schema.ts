// making the schema with zod validation so bad CSV data never hits the db

import { z } from "zod";

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

// r1, r2, r3...b1,b2,b3 each stand for color and team like red1 red2 and blue1 blue2

export const matchScheduleRowSchema = z.object({
  matchNumber: z.coerce.number().int().positive(),
  r1: z.coerce.number().int().positive(),
  r2: z.coerce.number().int().positive(),
  r3: z.coerce.number().int().positive(),
  b1: z.coerce.number().int().positive(),
  b2: z.coerce.number().int().positive(),
  b3: z.coerce.number().int().positive(),
});

export type ManualEventInput = z.input<typeof manualEventSchema>;
export type MatchScheduleRow = z.infer<typeof matchScheduleRowSchema>;
