import { z } from "zod";
import { matchTypeEnum } from "@/lib/database/schema/types";

const AllianceSchema = z.object({
  score: z.number(),
  team_keys: z.array(z.string()),
  surrogate_team_keys: z.array(z.string()).optional(),
});

const MatchSchema = z.object({
  comp_level: z.enum(matchTypeEnum.enumValues),
  match_number: z.number().int(),
  alliances: z.object({ red: AllianceSchema, blue: AllianceSchema }),
});

export const MatchScorePayloadSchema = z.object({
  message_type: z.literal("match_score"),
  message_data: z.object({
    event_key: z.string(),
    match: MatchSchema,
  }),
});

export const ScheduleUpdatedPayloadSchema = z.object({
  message_type: z.literal("schedule_updated"),
  message_data: z.object({
    event_key: z.string(),
    event_name: z.string(),
    first_match_time: z.number().optional(),
  }),
});

export type MatchScorePayload = z.infer<typeof MatchScorePayloadSchema>;
export type ScheduleUpdatedPayload = z.infer<typeof ScheduleUpdatedPayloadSchema>;
