"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/ui/components/combobox";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { toast } from "@repo/ui/components/sonner";
import { initialFormState, mergeForm, useForm, useTransform } from "@tanstack/react-form-nextjs";
import { startTransition, useActionState, useCallback, useEffect, useRef } from "react";
import { submitPitForm } from "../actions";
import { usePhotoUpload } from "../hooks/use-photo-upload";
import {
  PhotoCompressionProgress,
  PhotoUploadError,
  PhotoUploadProgress,
  PitPhotoUpload,
  type PitPhotoUploadRef,
} from "./PitPhotoUpload";
import { CLIMB_TYPE_OPTIONS, DRIVETRAIN_OPTIONS, FormSchema, formOpts } from "../types";

const DRIVING_ABILITIES = [
  { name: "canTrench", id: "can_trench", label: "Can Trench" },
  { name: "canBump", id: "can_bump", label: "Can Bump" },
  { name: "canShuttle", id: "can_shuttle", label: "Can Shuttle" },
] as const;

export function PitForm({ teams }: { teams: { teamNumber: number; teamName: string }[] }) {
  const [state, action, isPending] = useActionState(submitPitForm, initialFormState);
  const form = useForm({
    ...formOpts,
    transform: useTransform((baseForm) => mergeForm(baseForm, state ?? {}), [state]),
    validators: {
      onSubmit: FormSchema,
    },
  });

  const lastHandledSuccess = useRef<typeof state | null>(null);
  const lastHandledError = useRef<typeof state | null>(null);
  const photoUploadRef = useRef<PitPhotoUploadRef>(null);

  const { state: photoUploadState, uploadPhotos, reset: resetPhotoUpload } = usePhotoUpload();

  useEffect(() => {
    if ("_success" in state && state !== lastHandledSuccess.current) {
      lastHandledSuccess.current = state;
      if (typeof form.reset === "function") {
        form.reset();
      }
      resetPhotoUpload();
      photoUploadRef.current?.clearPhotos();
      toast.success("Pit form submitted successfully.", {
        position: "bottom-right",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (
      "_error" in state &&
      state !== lastHandledError.current &&
      typeof state._error === "string"
    ) {
      lastHandledError.current = state;
      resetPhotoUpload();
      toast.error(state._error, {
        position: "top-right",
      });
    }
  }, [state, form, resetPhotoUpload]);

  const handleSubmitWithPhotos = useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate form first
      await form.handleSubmit(e);
      if (!form.state.isValid) {
        return;
      }

      const teamNumber = Number(form.state.values.teamNumber);
      if (!teamNumber) {
        toast.error("Team number is required");
        return;
      }

      // Get pending photos
      const pendingFiles = photoUploadRef.current?.getPendingFiles() ?? [];

      // Build FormData from form values
      const buildFormData = (photoKeys?: string[]) => {
        const formData = new FormData();
        const values = form.state.values;

        formData.append("teamNumber", String(values.teamNumber));
        formData.append("drivetrainType", values.drivetrainType);
        formData.append("canTrench", values.canTrench ? "on" : "off");
        formData.append("canBump", values.canBump ? "on" : "off");
        formData.append("canShuttle", values.canShuttle ? "on" : "off");
        formData.append("capacity", String(values.capacity));
        formData.append("weight", String(values.weight));
        formData.append("climbType", values.climbType);

        if (photoKeys && photoKeys.length > 0) {
          formData.append("photoKeys", JSON.stringify(photoKeys));
        }

        return formData;
      };

      // Upload photos if any, or submit form directly
      const photoKeys = await uploadPhotos(pendingFiles, teamNumber);

      // If uploadPhotos returned null, there was an error (already handled by the hook)
      if (pendingFiles.length > 0 && photoKeys === null) {
        return;
      }

      // Build FormData with form fields and photo keys
      const formData = buildFormData(photoKeys ?? undefined);

      startTransition(() => {
        action(formData);
      });
    },
    [form, action, uploadPhotos]
  );

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.state.isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form.state.isDirty]);

  return (
    <form onSubmit={handleSubmitWithPhotos} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Number</CardTitle>
        </CardHeader>
        <CardContent>
          <form.Field name="teamNumber">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field>
                  <FieldLabel className="sr-only">Team Number</FieldLabel>
                  <Combobox
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onValueChange={(v) => {
                      v && field.handleChange(v);
                    }}
                    items={teams}
                  >
                    <ComboboxInput
                      onBlur={field.handleBlur}
                      aria-label="Team number"
                      aria-invalid={isInvalid}
                      placeholder="Select team"
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem key={item.teamNumber} value={item.teamNumber.toString()}>
                            {item.teamNumber} - {item.teamName}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drivetrain Type</CardTitle>
          <CardDescription>Select the drivetrain type of the robot.</CardDescription>
        </CardHeader>
        <CardContent>
          <form.Field name="drivetrainType">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <div>
                  <RadioGroup
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                    aria-label="Drivetrain Type"
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as (typeof DRIVETRAIN_OPTIONS)[number])
                    }
                    className="flex flex-wrap gap-2.5"
                  >
                    {DRIVETRAIN_OPTIONS.map((type) => (
                      <div key={type}>
                        <RadioGroupItem
                          id={`drivetrain-${type}`}
                          value={type}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`drivetrain-${type}`}
                          className="cursor-pointer select-none rounded-lg border border-border bg-muted/50 px-[18px] py-3 text-sm whitespace-nowrap transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-focus-visible:border-ring"
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </div>
              );
            }}
          </form.Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Driving Ability</CardTitle>
          <CardDescription>Select all capabilities that apply to this robot.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {DRIVING_ABILITIES.map(({ name, id, label }) => (
              <form.Field key={name} name={name}>
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <div>
                      <Label
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 text-sm transition-colors hover:bg-accent has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                      >
                        <Checkbox
                          id={id}
                          name={name}
                          checked={field.state.value}
                          onBlur={field.handleBlur}
                          onCheckedChange={(checked) => field.handleChange(checked === true)}
                          aria-invalid={isInvalid}
                        />
                        {label}
                      </Label>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </div>
                  );
                }}
              </form.Field>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
          <CardDescription>Quantitative measurements of the robot.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <form.Field name="capacity">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field>
                    <FieldLabel>Capacity (pieces)</FieldLabel>
                    <Input
                      type="number"
                      id="capacity"
                      name={field.name}
                      value={field.state.value === 0 ? "" : field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(e.target.value === "" ? 0 : Number(e.target.value))
                      }
                      placeholder="e.g. 4"
                      inputMode="numeric"
                      pattern="[0-9]*"
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
                      placeholder="e.g. 120"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={0}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Climb Type</CardTitle>
        </CardHeader>
        <CardContent>
          <form.Field name="climbType">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <div>
                  <RadioGroup
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                    aria-label="Climb Type"
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as (typeof CLIMB_TYPE_OPTIONS)[number])
                    }
                    className="flex flex-wrap gap-2.5"
                  >
                    {CLIMB_TYPE_OPTIONS.map((type) => (
                      <div key={type}>
                        <RadioGroupItem
                          id={`climb-${type}`}
                          value={type}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`climb-${type}`}
                          className="cursor-pointer select-none rounded-lg border border-border bg-muted/50 px-[18px] py-3 text-sm whitespace-nowrap transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-focus-visible:border-ring"
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </div>
              );
            }}
          </form.Field>
        </CardContent>
      </Card>

      <PitPhotoUpload ref={photoUploadRef} disabled={photoUploadState.status !== "idle"}>
        {photoUploadState.status === "compressing" && (
          <PhotoCompressionProgress value={photoUploadState.compressionProgress} />
        )}
        {photoUploadState.status === "uploading" && photoUploadState.uploadProgress && (
          <PhotoUploadProgress {...photoUploadState.uploadProgress} />
        )}
        {photoUploadState.error && <PhotoUploadError message={photoUploadState.error} />}
      </PitPhotoUpload>

      <div className="sticky bottom-0 bg-background pb-5 pt-3">
        <Button
          type="submit"
          disabled={form.state.isSubmitting || isPending || photoUploadState.status !== "idle"}
          className="w-full"
        >
          {photoUploadState.status === "compressing"
            ? "Compressing photos..."
            : photoUploadState.status === "uploading"
              ? "Uploading photos..."
              : form.state.isSubmitting || isPending
                ? "Submitting..."
                : "Submit"}
        </Button>
      </div>
    </form>
  );
}
