import { formOptions } from "@tanstack/react-form-nextjs";
import * as z from "zod";

export const WORKABILITY_ROLE_OPTIONS = ["driver", "human_player"] as const;
export const WORKABILITY_RATING_OPTIONS = [1, 2, 3, 4, 5] as const;
export const [WORKABILITY_RATING_MIN, , , , WORKABILITY_RATING_MAX] = WORKABILITY_RATING_OPTIONS;
export const WORKABILITY_RATING_DEFAULT = 3;
export const WORKABILITY_NOTES_MAX_LENGTH = 1500;

export type WorkabilityRole = (typeof WORKABILITY_ROLE_OPTIONS)[number];

export const WORKABILITY_ROLE_LABELS: Record<WorkabilityRole, string> = {
  driver: "Driver",
  human_player: "Human Player",
};

export const WORKABILITY_ROLE_DESCRIPTIONS: Record<WorkabilityRole, string> = {
  driver: "Focus on communication, cycle spacing, field awareness, and role fit during matches.",
  human_player:
    "Focus on loading rhythm, visibility, timing, and how easy it is to support this team in-match.",
};

export function normalizeWorkabilityRating(rating: number) {
  if (!Number.isFinite(rating)) {
    return WORKABILITY_RATING_DEFAULT;
  }

  return Math.min(WORKABILITY_RATING_MAX, Math.max(WORKABILITY_RATING_MIN, Math.round(rating)));
}

export const FormSchema = z.object({
  matchNumber: z.coerce.number().int().positive("Match number is required"),
  teamNumber: z.coerce.number().int().positive("Team number is required"),
  role: z.enum(WORKABILITY_ROLE_OPTIONS),
  rating: z.coerce
    .number()
    .int("Rating must be a whole number")
    .min(WORKABILITY_RATING_MIN, "Rating must be between 1 and 5")
    .max(WORKABILITY_RATING_MAX, "Rating must be between 1 and 5"),
  notes: z.string().max(WORKABILITY_NOTES_MAX_LENGTH, "Notes are too long"),
});

export const WORKABILITY_FORM_DEFAULT_VALUES: z.input<typeof FormSchema> = {
  matchNumber: 0,
  teamNumber: 0,
  role: "driver",
  rating: WORKABILITY_RATING_DEFAULT,
  notes: "",
};

export const formOpts = formOptions({
  defaultValues: WORKABILITY_FORM_DEFAULT_VALUES,
});

export interface EditableWorkabilitySubmission {
  id: string;
  matchNumber: number;
  teamNumber: number;
  role: WorkabilityRole;
  rating: number;
  notes: string;
  updatedAt: string;
}

export interface WorkabilityMatchTeamOption {
  teamNumber: number;
  teamName: string;
  alliance: "red" | "blue";
  position: number;
}

export interface WorkabilityMatchOption {
  matchNumber: number;
  teams: WorkabilityMatchTeamOption[];
}

export interface WorkabilityNote {
  matchNumber: number;
  role: WorkabilityRole;
  note: string;
  authorName: string | null;
  updatedAt: string;
}

export interface TeamWorkabilitySummary {
  teamNumber: number;
  avgDriverWorkability: number | null;
  avgHumanPlayerWorkability: number | null;
  compositeCompatibilityScore: number | null;
  submissionCount: number;
  noteCount: number;
  notes: WorkabilityNote[];
}
