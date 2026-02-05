import { formOptions } from "@tanstack/react-form-nextjs";
import * as z from "zod";

export const DRIVETRAIN_OPTIONS = ["tank", "swerve", "mecanum", "other"] as const;
export const CLIMB_TYPE_OPTIONS = ["sides", "center", "left", "right", "any", "none"] as const;

export const formOpts = formOptions({
  defaultValues: {
    teamNumber: 0,
    drivetrainType: "tank",
    canTrench: false,
    canBump: false,
    canShuttle: false,
    capacity: 0,
    weight: 0,
    climbType: "none",
  },
});

export const FormSchema = z.object({
  teamNumber: z.number().int().positive("Team number is required"),
  drivetrainType: z.enum(DRIVETRAIN_OPTIONS, {
    error: "Drivetrain type is required",
  }),
  canTrench: z.boolean(),
  canBump: z.boolean(),
  canShuttle: z.boolean(),
  capacity: z.number().int().positive("Capacity is required"),
  weight: z.number().int().positive("Weight is required"),
  climbType: z.enum(CLIMB_TYPE_OPTIONS, {
    error: "Climb type is required",
  }),
});
