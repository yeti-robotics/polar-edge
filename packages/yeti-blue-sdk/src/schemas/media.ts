import { z } from "zod";

export const MediaSchema = z.object({
  type: z.string(),
  foreign_key: z.string(),
  details: z.record(z.string(), z.any()),
  preferred: z.boolean().optional(),
  team_keys: z.array(z.string()),
  direct_url: z.string(),
  view_url: z.string(),
});

export type Media = z.infer<typeof MediaSchema>;
