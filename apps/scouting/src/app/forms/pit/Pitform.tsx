"use client";

import { Checkbox } from "@repo/ui/components/checkbox";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { useForm } from "@tanstack/react-form";
import * as z from "zod";

const DRIVETRAIN_OPTIONS = ["tank", "swerve", "mecanum", "other"] as const;
const CLIMB_TYPE_OPTIONS = ["sides", "center", "left", "right", "any", "none"] as const;

const formSchema = z.object({
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

export function PitForm() {
  const form = useForm({
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
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      console.log(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <form.Field name="teamNumber">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field>
              <FieldLabel>Team Number</FieldLabel>
              <Input
                type="number"
                id="team_number"
                name={field.name}
                value={field.state.value === 0 ? "" : field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value === "" ? 0 : Number(e.target.value))
                }
                placeholder="Enter Team Number"
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="drivetrainType">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field orientation="vertical">
              <FieldLabel>Drivetrain Type</FieldLabel>
              <RadioGroup
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                aria-invalid={isInvalid}
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
              >
                {DRIVETRAIN_OPTIONS.map((type) => (
                  <Label
                    key={type}
                    htmlFor={`drivetrain-${type}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <RadioGroupItem id={`drivetrain-${type}`} value={type} />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Label>
                ))}
              </RadioGroup>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      <FieldSet>
        <FieldLegend>Robot Driving Ability</FieldLegend>
        <div data-slot="checkbox-group" className="flex flex-col gap-3">
          <form.Field name="canTrench">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <div className="space-y-1">
                  <Label
                    htmlFor="can_trench"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      id="can_trench"
                      checked={field.state.value}
                      onBlur={field.handleBlur}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      aria-invalid={isInvalid}
                    />
                    Can Trench
                  </Label>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </div>
              );
            }}
          </form.Field>
          <form.Field name="canBump">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <div className="space-y-1">
                  <Label
                    htmlFor="can_bump"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      id="can_bump"
                      checked={field.state.value}
                      onBlur={field.handleBlur}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      aria-invalid={isInvalid}
                    />
                    Can Bump
                  </Label>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </div>
              );
            }}
          </form.Field>
          <form.Field name="canShuttle">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <div className="space-y-1">
                  <Label
                    htmlFor="can_shuttle"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      id="can_shuttle"
                      checked={field.state.value}
                      onBlur={field.handleBlur}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      aria-invalid={isInvalid}
                    />
                    Can Shuttle
                  </Label>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </div>
              );
            }}
          </form.Field>
        </div>
      </FieldSet>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field name="capacity">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field>
                <FieldLabel>Capacity</FieldLabel>
                <Input
                  type="number"
                  id="capacity"
                  name={field.name}
                  value={field.state.value === 0 ? "" : field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.value === "" ? 0 : Number(e.target.value))
                  }
                  placeholder="0"
                  min={0}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="weight">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field>
                <FieldLabel>Weight (lbs)</FieldLabel>
                <Input
                  type="number"
                  id="weight"
                  name={field.name}
                  value={field.state.value === 0 ? "" : field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.value === "" ? 0 : Number(e.target.value))
                  }
                  placeholder="0"
                  min={0}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </div>

      <form.Field name="climbType">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field>
              <FieldLabel>Climb Type </FieldLabel>
              <RadioGroup
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                aria-invalid={isInvalid}
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
                className="flex flex-col gap-3"
              >
                {CLIMB_TYPE_OPTIONS.map((type) => (
                  <Label
                    key={type}
                    htmlFor={`climb-${type}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <RadioGroupItem id={`climb-${type}`} value={type} />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Label>
                ))}
              </RadioGroup>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>
    </form>
  );
}
