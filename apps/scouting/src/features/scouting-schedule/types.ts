import * as z from "zod";

export type {
  ScoutingScheduleInfoItem,
  ScoutingScheduleInfoSection,
  ScoutingScheduleShiftSection,
} from "@/lib/database/schema/tables/scouting-schedule";

export const SCOUTING_ASSIGNMENT_SLOTS = [1, 2] as const;

export const ScoutingScheduleInfoItemSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().trim().min(1).max(80),
  time: z.string().trim().min(1).max(40),
});

export const ScoutingScheduleInfoSectionSchema = z.object({
  id: z.string().min(1).max(120),
  dateLabel: z.string().trim().min(1).max(80),
  items: z.array(ScoutingScheduleInfoItemSchema).max(10),
});

export const ScoutingScheduleShiftSectionSchema = z
  .object({
    id: z.string().min(1).max(120),
    label: z.string().trim().min(1).max(80),
    startMatch: z.coerce.number().int().positive(),
    endMatch: z.coerce.number().int().positive(),
    coordinatorMemberId: z.string().trim().min(1).nullable(),
  })
  .refine((value) => value.startMatch <= value.endMatch, {
    message: "Shift ranges must start before they end",
    path: ["endMatch"],
  });

export const CreateScoutingScheduleSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
});

export const UpdateScoutingScheduleDetailsSchema = z
  .object({
    scheduleId: z.string().uuid(),
    name: z.string().trim().min(1).max(100),
    isOpen: z.boolean(),
    infoSections: z.array(ScoutingScheduleInfoSectionSchema).max(12),
    shiftSections: z.array(ScoutingScheduleShiftSectionSchema).max(16),
  })
  .superRefine((value, ctx) => {
    const sorted = [...value.shiftSections].sort((a, b) => a.startMatch - b.startMatch);

    for (let index = 1; index < sorted.length; index++) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (!previous || !current) continue;

      if (current.startMatch <= previous.endMatch) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Shift ranges cannot overlap",
          path: ["shiftSections"],
        });
        break;
      }
    }
  });

export const UpdateScoutingScheduleAssignmentSchema = z.object({
  scheduleId: z.string().uuid(),
  teamMatchId: z.coerce.number().int().positive(),
  slotIndex: z.coerce.number().int().min(1).max(2),
  memberId: z.string().trim().min(1).nullable(),
});
