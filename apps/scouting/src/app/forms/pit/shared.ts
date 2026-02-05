import { formOptions } from "@tanstack/react-form-nextjs";
import * as z from "zod";

export const DRIVETRAIN_OPTIONS = ["tank", "swerve", "mecanum", "other"] as const;
export const CLIMB_TYPE_OPTIONS = ["sides", "center", "left", "right", "any", "none"] as const;

export type DrivetrainType = (typeof DRIVETRAIN_OPTIONS)[number];
export type ClimbType = (typeof CLIMB_TYPE_OPTIONS)[number];
type FormValues = z.infer<typeof FormSchema>;

const defaultValues: FormValues = {
  teamNumber: 0,
  drivetrainType: "tank",
  canTrench: false,
  canBump: false,
  canShuttle: false,
  capacity: 0,
  weight: 0,
  climbType: "none",
};

export const formOpts = formOptions({
  defaultValues,
});

export const FormSchema = z.object({
  teamNumber: z.number().int().positive("Team number is required"),
  drivetrainType: z.enum(DRIVETRAIN_OPTIONS, {
    message: "Invalid drivetrain type",
  }),
  canTrench: z.boolean().optional(),
  canBump: z.boolean().optional(),
  canShuttle: z.boolean().optional(),
  capacity: z.number().int().positive("Capacity is required"),
  weight: z.number().int().positive("Weight is required"),
  climbType: z.enum(CLIMB_TYPE_OPTIONS, {
    message: "Invalid climb type",
  }),
});
