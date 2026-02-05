"use client";

import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { toast } from "@repo/ui/components/sonner";
import { initialFormState, mergeForm, useForm, useTransform } from "@tanstack/react-form-nextjs";
import { useActionState, useRef } from "react";
import { submitPitForm } from "./action";
import { CLIMB_TYPE_OPTIONS, DRIVETRAIN_OPTIONS, FormSchema, formOpts } from "./shared";

export function PitForm() {
  const [state, action, isPending] = useActionState(submitPitForm, initialFormState);
  const form = useForm({
    ...formOpts,
    transform: useTransform((baseForm) => mergeForm(baseForm, state ?? {}), [state]),
    validators: {
      onSubmit: FormSchema,
    },
  });

  const lastHandledSuccess = useRef<typeof state | null>(null);
  if ("_success" in state && state !== lastHandledSuccess.current) {
    lastHandledSuccess.current = state;

    form.reset();
    toast.success("Pit form submitted successfully.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <form action={action} onSubmit={form.handleSubmit} className="space-y-6">
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
                onValueChange={(v) => field.handleChange(v as (typeof DRIVETRAIN_OPTIONS)[number])}
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
                  <Label htmlFor="can_trench" className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      id="can_trench"
                      name="canTrench"
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
                  <Label htmlFor="can_bump" className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      id="can_bump"
                      name="canBump"
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
                  <Label htmlFor="can_shuttle" className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      id="can_shuttle"
                      name="canShuttle"
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
                onValueChange={(v) => field.handleChange(v as (typeof CLIMB_TYPE_OPTIONS)[number])}
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
      <Button type="submit" disabled={form.state.isSubmitting || isPending} className="w-full">
        {form.state.isSubmitting || isPending ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
