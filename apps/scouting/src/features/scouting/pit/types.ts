import { formOptions } from "@tanstack/react-form-nextjs";
import * as z from "zod";

export const DRIVETRAIN_OPTIONS = ["tank", "swerve", "mecanum", "other"] as const;
export const CLIMB_TYPE_OPTIONS = ["sides", "center", "left", "right", "any", "none"] as const;
export const SHOOTER_OPTIONS = ["turret", "fixed"] as const;
export const ARCHETYPE_OPTIONS = [
  "defense",
  "feeder",
  "cycler",
  "shooter",
  "climber",
  "support",
] as const;
export const PIT_COMMENTS_MAX_LENGTH = 2000;

const DRIVETRAIN_LABELS: Record<(typeof DRIVETRAIN_OPTIONS)[number], string> = {
  tank: "Tank Drive",
  swerve: "Swerve Drive",
  mecanum: "Mecanum Drive",
  other: "Other",
};

export function formatPitDrivetrain(
  drivetrainType: string,
  drivetrainOther?: string | null
): string {
  if (drivetrainType === "other") {
    return drivetrainOther?.trim() || DRIVETRAIN_LABELS.other;
  }

  return DRIVETRAIN_LABELS[drivetrainType as keyof typeof DRIVETRAIN_LABELS] ?? drivetrainType;
}

export const FormSchema = z
  .object({
    teamNumber: z.coerce.number().int().positive("Team number is required"),
    drivetrainType: z
      .union([z.enum(DRIVETRAIN_OPTIONS), z.literal("")])
      .refine((val): val is (typeof DRIVETRAIN_OPTIONS)[number] => val !== "", {
        message: "Drivetrain type is required",
      }),
    drivetrainOther: z.string().trim(),
    archetype: z.union([z.enum(ARCHETYPE_OPTIONS), z.literal("")]),
    canTrench: z.boolean().optional(),
    canBump: z.boolean().optional(),
    canShuttle: z.boolean().optional(),
    capacity: z
      .number()
      .int()
      .positive("Capacity is required")
      .max(200, "Capacity cannot exceed 200"),
    weight: z.number().int().positive("Weight is required"),
    climbType: z
      .union([z.enum(CLIMB_TYPE_OPTIONS), z.literal("")])
      .refine((val): val is (typeof CLIMB_TYPE_OPTIONS)[number] => val !== "", {
        message: "Climb type is required",
      }),
    shooterType: z.union([z.enum(SHOOTER_OPTIONS), z.literal("")]),
    canShootWhileMoving: z.boolean().optional(),
    comments: z
      .string()
      .trim()
      .max(PIT_COMMENTS_MAX_LENGTH, `Comments cannot exceed ${PIT_COMMENTS_MAX_LENGTH} characters`),
  })
  .superRefine((values, ctx) => {
    if (values.canShootWhileMoving && values.shooterType === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["canShootWhileMoving"],
        message: "Select a shooter type before enabling moving shots",
      });
    }
  });

const defaultValues: z.input<typeof FormSchema> = {
  teamNumber: 0,
  drivetrainType: "",
  drivetrainOther: "",
  archetype: "",
  canTrench: false,
  canBump: false,
  canShuttle: false,
  capacity: 0,
  weight: 0,
  climbType: "",
  shooterType: "",
  canShootWhileMoving: false,
  comments: "",
};

export const formOpts = formOptions({
  defaultValues,
});

export type PitFormValues = z.output<typeof FormSchema>;
