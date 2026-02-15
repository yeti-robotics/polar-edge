import { z } from "zod";

export const CreatePicklistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
});

export type CreatePicklistInput = z.infer<typeof CreatePicklistSchema>;

export const AddTeamToPicklistSchema = z.object({
  picklistId: z.string().uuid("Invalid picklist ID"),
  teamNumber: z
    .number()
    .int("Team number must be an integer")
    .positive("Team number must be positive"),
  rank: z.number().int("Rank must be an integer").positive("Rank must be positive"),
});

export type AddTeamToPicklistInput = z.infer<typeof AddTeamToPicklistSchema>;

export const RemoveTeamFromPicklistSchema = z.object({
  picklistId: z.string().uuid("Invalid picklist ID"),
  teamNumber: z
    .number()
    .int("Team number must be an integer")
    .positive("Team number must be positive"),
});

export type RemoveTeamFromPicklistInput = z.infer<typeof RemoveTeamFromPicklistSchema>;

export const DeletePicklistSchema = z.object({
  picklistId: z.string().uuid("Invalid picklist ID"),
});

export type DeletePicklistInput = z.infer<typeof DeletePicklistSchema>;

export const ReorderPicklistTeamSchema = z.object({
  picklistId: z.string().uuid("Invalid picklist ID"),
  teamNumber: z
    .number()
    .int("Team number must be an integer")
    .positive("Team number must be positive"),
  newRank: z.number().int("Rank must be an integer").positive("Rank must be positive"),
});

export type ReorderPicklistTeamInput = z.infer<typeof ReorderPicklistTeamSchema>;

export const TogglePickedSchema = z.object({
  picklistId: z.string().uuid("Invalid picklist ID"),
  teamNumber: z
    .number()
    .int("Team number must be an integer")
    .positive("Team number must be positive"),
  picked: z.boolean(),
});

export type TogglePickedInput = z.infer<typeof TogglePickedSchema>;

export const UpdatePicklistTeamNotesSchema = z.object({
  picklistId: z.string().uuid("Invalid picklist ID"),
  teamNumber: z
    .number()
    .int("Team number must be an integer")
    .positive("Team number must be positive"),
  notes: z.string().max(1000, "Notes must be 1000 characters or less"),
});

export type UpdatePicklistTeamNotesInput = z.infer<typeof UpdatePicklistTeamNotesSchema>;
