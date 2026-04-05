import { z } from "zod";

// ===== SHARED TYPES =====

export type ActionType = "shooting" | "climbing";
export type Phase = "auto" | "teleop";
export type StandFormStage = "match_selection" | "autonomous" | "teleop" | "comments";

export const STAGES: StandFormStage[] = ["match_selection", "autonomous", "teleop", "comments"];

export type ActiveAction = {
  type: ActionType;
  startedAt: number; // timestamp (ms)
  phase: Phase;
};

export type CompletedCycle = {
  phase: Phase;
  cycleNumber: number;
  startedAt: number;
  endedAt: number;
};

export type CompletedClimb = {
  phase: Phase;
  startedAt: number;
  endedAt: number;
  climbLevel: number; // 0=none, 1=L1, 2=L2, 3=L3
  climbSuccess: boolean;
};

// ===== ZOD SCHEMAS =====

export const CycleSchema = z
  .object({
    phase: z.enum(["auto", "teleop"]),
    cycleNumber: z.number().int().positive(),
    startedAt: z.number(),
    endedAt: z.number(),
  })
  .refine((data) => data.endedAt > data.startedAt, {
    message: "End time must be after start time",
  });

export const ClimbSchema = z
  .object({
    phase: z.enum(["auto", "teleop"]),
    startedAt: z.number(),
    endedAt: z.number(),
    climbLevel: z.number().int().min(0).max(3),
    climbSuccess: z.boolean(),
  })
  .refine((data) => data.endedAt > data.startedAt, {
    message: "End time must be after start time",
  });

export const COMMENTS_MIN_LENGTH = 32;

export const StandFormSchema = z.object({
  teamMatchId: z.number().positive(),
  comments: z
    .string()
    .min(COMMENTS_MIN_LENGTH, `Comments must be at least ${COMMENTS_MIN_LENGTH} characters`),
  oofTimeSeconds: z.number().int().min(0),
  cycles: z.array(CycleSchema),
  climbs: z.array(ClimbSchema),
});

export type StandFormSubmission = z.infer<typeof StandFormSchema>;
