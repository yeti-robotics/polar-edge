import { z } from "zod";

export const DistrictEventPointsSchema = z.object({
  district_cmp: z.boolean(),
  total: z.number().min(0),
  alliance_points: z.number().min(0),
  elim_points: z.number().min(0),
  award_points: z.number().min(0),
  event_key: z.string(),
  qual_points: z.number().min(0),
});

export const ListOfRankingsSchema = z.object({
  matches_played: z.number().min(0),
  qual_average: z.number().min(0).nullable(),
  extra_stats: z.array(z.any()),
  sort_orders: z.number().min(0).nullable(),
  record: z
    .object({
      wins: z.number().min(0),
      losses: z.number().min(0),
      ties: z.number().min(0),
    })
    .nullable(),
  rank: z.number().positive(),
  team_key: z.string().regex(/^frc\d+$/),
  dq: z.number().min(0),
});

export const ExtraStatsInfoSchema = z.object({
  precision: z.number().min(0),
  name: z.string().regex(/^frc\d+$/),
});

export const SortOrderInfoSchema = z.object({
  precision: z.number().min(0),
  name: z.string().regex(/^frc\d+$/),
});

export const EventRankingsSchema = z.object({
  rankings: z.array(ListOfRankingsSchema),
  extra_stats_info: z.array(ExtraStatsInfoSchema),
  sort_order_info: z.array(SortOrderInfoSchema),
});

export const DistrictRankingSchema = z.object({
  team_key: z.string().regex(/^frc\d+$/),
  rank: z.number().positive(),
  rookie_bonus: z.number().min(0).optional(),
  point_total: z.number().min(0),
  event_points: z.array(DistrictEventPointsSchema).optional(),
});

export const RegionalPoolRankingSchema = z.object({
  team_key: z.string().regex(/^frc\d+$/),
  rank: z.number().positive(),
  rookie_bonus: z.number().min(0).optional(),
  point_total: z.number().min(0),
  single_event_bonus: z.number().min(0).optional(),
  event_points: z.array(DistrictEventPointsSchema).optional(),
});

export type DistrictRanking = z.infer<typeof DistrictRankingSchema>;
export type RegionalPoolRanking = z.infer<typeof RegionalPoolRankingSchema>;
export type EventRankings = z.infer<typeof EventRankingsSchema>;
