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
import { Field, FieldError, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { toast } from "@repo/ui/components/sonner";
import { initialFormState, mergeForm, useForm, useTransform } from "@tanstack/react-form-nextjs";
import { useActionState, useCallback, useEffect, useRef, useState, startTransition } from "react";
import { submitPitForm } from "./action";
import { PitPhotoUpload, type PitPhotoUploadRef } from "./PitPhotoUpload";
import { CLIMB_TYPE_OPTIONS, DRIVETRAIN_OPTIONS, FormSchema, formOpts } from "./shared";

const DRIVING_ABILITIES = [
  { name: "canTrench", id: "can_trench", label: "Can Trench" },
  { name: "canBump", id: "can_bump", label: "Can Bump" },
  { name: "canShuttle", id: "can_shuttle", label: "Can Shuttle" },
] as const;

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
  const lastHandledError = useRef<typeof state | null>(null);
  const photoUploadRef = useRef<PitPhotoUploadRef>(null);

  const [photoUploadState, setPhotoUploadState] = useState<{
    status: "idle" | "compressing" | "uploading";
    uploadProgress?: { current: number; total: number };
    error?: string;
  }>({ status: "idle" });

  useEffect(() => {
    if ("_success" in state && state !== lastHandledSuccess.current) {
      lastHandledSuccess.current = state;
      if (typeof form.reset === "function") {
        form.reset();
      }
      setPhotoUploadState({ status: "idle" });
      toast.success("Pit form submitted successfully.", {
        position: "top-right",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (
      "_error" in state &&
      state !== lastHandledError.current &&
      typeof state._error === "string"
    ) {
      lastHandledError.current = state;
      setPhotoUploadState({ status: "idle" });
      toast.error(state._error, {
        position: "top-right",
      });
    }
  }, [state, form]);

  const handleSubmitWithPhotos = useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate form first
      await form.handleSubmit(e);
      if (!form.state.isValid) {
        return;
      }

      const teamNumber = form.state.values.teamNumber;
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

      if (pendingFiles.length === 0) {
        // No photos, submit normally
        startTransition(() => {
          action(buildFormData());
        });
        return;
      }

      try {
        setPhotoUploadState({ status: "compressing" });

        // Dynamically import compression utility
        const { compressImage } = await import("@/lib/compress-image");

        // Compress all photos in parallel
        const compressionResults = await Promise.all(
          pendingFiles.map((file) => compressImage(file))
        );

        // Check for compression errors
        const firstError = compressionResults.find((r) => "error" in r);
        if (firstError && "error" in firstError) {
          setPhotoUploadState({ status: "idle", error: firstError.error });
          toast.error(firstError.error);
          return;
        }

        // Extract compressed files
        const compressedFiles = compressionResults
          .filter((r): r is { file: File } => "file" in r)
          .map((r) => r.file);

        setPhotoUploadState({
          status: "uploading",
          uploadProgress: { current: 0, total: compressedFiles.length },
        });

        // Get all presigned URLs in parallel
        const { getPhotoUploadUrl } = await import("./photo-actions");
        const urlPromises = compressedFiles.map((_, index) =>
          getPhotoUploadUrl({
            teamNumber,
            index,
            contentType: "image/jpeg",
          })
        );

        const urlResults = await Promise.all(urlPromises);

        // Check for URL generation errors
        const firstUrlError = urlResults.find((r) => "error" in r);
        if (firstUrlError && "error" in firstUrlError) {
          setPhotoUploadState({ status: "idle", error: firstUrlError.error });
          toast.error(firstUrlError.error);
          return;
        }

        // Extract URLs and keys
        const urlsAndKeys = urlResults.filter(
          (r): r is { url: string; key: string } => "url" in r && "key" in r
        );

        // Upload all photos in parallel
        const uploadPromises = compressedFiles.map(async (file, index) => {
          const urlData = urlsAndKeys[index];
          if (!urlData) {
            throw new Error(`Missing URL for photo ${index + 1}`);
          }
          const { url, key } = urlData;

          try {
            const response = await fetch(url, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": "image/jpeg",
              },
            });

            if (!response.ok) {
              const errorText = await response.text().catch(() => "No error details");
              console.error(`Upload failed for photo ${index + 1}:`, {
                status: response.status,
                statusText: response.statusText,
                errorText,
                url: url.split("?")[0], // Log URL without query params
              });
              throw new Error(
                `Upload failed for photo ${index + 1}: ${response.status} ${response.statusText}`
              );
            }

            setPhotoUploadState((prev) => ({
              ...prev,
              uploadProgress: { current: index + 1, total: compressedFiles.length },
            }));

            return key;
          } catch (error) {
            console.error(`Network error uploading photo ${index + 1}:`, error);
            throw error;
          }
        });

        const photoKeys = await Promise.all(uploadPromises);

        // Build FormData with form fields and photo keys
        const formData = buildFormData(photoKeys);

        setPhotoUploadState({ status: "idle" });
        startTransition(() => {
          action(formData);
        });
      } catch (error) {
        console.error("Photo upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to upload photos";
        setPhotoUploadState({ status: "idle", error: errorMessage });
        toast.error(errorMessage);
      }
    },
    [form, action]
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
                  <Input
                    type="number"
                    id="team_number"
                    name={field.name}
                    value={field.state.value === 0 ? "" : field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    placeholder="e.g. 3506"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoFocus
                    aria-invalid={isInvalid}
                  />
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

      <PitPhotoUpload
        ref={photoUploadRef}
        status={photoUploadState.status}
        uploadProgress={photoUploadState.uploadProgress}
        error={photoUploadState.error}
      />

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
