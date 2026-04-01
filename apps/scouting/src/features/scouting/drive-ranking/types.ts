import { z } from "zod";

export const DriveRankingSubmissionSchema = z.object({
  matchNumber: z.number().int().positive(),
  alliance: z.enum(["red", "blue"]),
  /** Team numbers ordered by rank: index 0 = rank 1 (best), index 2 = rank 3 */
  rankings: z
    .array(z.number().int().positive())
    .length(3)
    .refine((arr) => new Set(arr).size === 3, "All three teams must be different"),
});

export type DriveRankingSubmission = z.infer<typeof DriveRankingSubmissionSchema>;

export type Alliance = "red" | "blue";

export type DriveTeamRating = {
  teamNumber: number;
  teamName: string;
  mu: number;
  sigma: number;
  ordinal: number;
  matchesRanked: number;
};

export type DriveRatingHistoryPoint = {
  matchNumber: number;
  matchType: string;
  eventCode: string;
  ordinal: number;
  mu: number;
  sigma: number;
  rank: number;
};
