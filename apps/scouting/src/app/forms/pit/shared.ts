import { formOptions } from "@tanstack/react-form-nextjs";
import * as z from "zod";

export const DRIVETRAIN_OPTIONS = ["tank", "swerve", "mecanum", "other"] as const;
export const CLIMB_TYPE_OPTIONS = ["sides", "center", "left", "right", "any", "none"] as const;

export const FormSchema = z.object({
  teamNumber: z.coerce.number().int().positive("Team number is required"),
  drivetrainType: z
    .union([z.enum(DRIVETRAIN_OPTIONS), z.literal("")])
    .refine((val): val is (typeof DRIVETRAIN_OPTIONS)[number] => val !== "", {
      message: "Drivetrain type is required",
    }),
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
});

const defaultValues: z.input<typeof FormSchema> = {
  teamNumber: 0,
  drivetrainType: "",
  canTrench: false,
  canBump: false,
  canShuttle: false,
  capacity: 0,
  weight: 0,
  climbType: "",
};

export const formOpts = formOptions({
  defaultValues,
});
