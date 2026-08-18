"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { useForm } from "@tanstack/react-form-nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createManualEventAction } from "../actions";

type Message = {
  type: "success" | "error";
  text: string;
};

type CreateManualEventValues = {
  eventCode: string;
  name: string;
  startDate: string;
  endDate: string;
  csvFile: File | null; // changed so it isnt null as FIle becaus asserting hided errrors i see why now 
};

const defaultValues: CreateManualEventValues = {
  eventCode: "",
  name: "",
  startDate: "",
  endDate: "",
  csvFile: null,
};

const required =
  (label: string) =>
  ({ value }: { value: string }) =>
    value.trim() ? undefined : { message: `${label} is required` };

export function CreateManualEventForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setMessage(null);

      if (!value.csvFile) {
        setMessage({ type: "error", text: "Select a CSV file to upload." });
        return;
      }

      try {
        const result = await createManualEventAction(
          organizationId,
          {
            eventCode: value.eventCode,
            name: value.name,
            startDate: value.startDate,
            endDate: value.endDate,
          },
          await value.csvFile.text()
        );

        if (result.error) {
          setMessage({ type: "error", text: result.error });
          return;
        }

        form.reset();
        setMessage({ type: "success", text: "Event created successfully." });
        router.refresh();
      } catch (error) {
        console.error(error);
        setMessage({ type: "error", text: "Failed to create the event." });
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create manual event</CardTitle>
        <CardDescription>
          Create an offseason event and upload its complete qualification match schedule.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="eventCode" validators={{ onBlur: required("Event code") }}>
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Event code</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="e.g. 2026thorwest"
                      aria-invalid={isInvalid}
                      required
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="name" validators={{ onBlur: required("Event name") }}>
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Event name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="e.g. THOR West 2026"
                      aria-invalid={isInvalid}
                      required
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="startDate" validators={{ onBlur: required("Start date") }}>
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Start date</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      aria-invalid={isInvalid}
                      required
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field
              name="endDate"
              validators={{
                onBlur: ({ value, fieldApi }) => {
                  if (!value.trim()) return { message: "End date is required" };
                  const startDate = fieldApi.form.getFieldValue("startDate");
                  return startDate && value < startDate
                    ? { message: "End date must be on or after the start date" }
                    : undefined;
                },
              }}
            >
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>End date</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      aria-invalid={isInvalid}
                      required
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          <form.Field
            name="csvFile"
            validators={{
              onChange: ({ value }) =>
                value === null ? { message: "A CSV file is required" } : undefined,
            }}
          >
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Match-schedule CSV</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="file"
                    accept=".csv,text/csv"
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.files?.[0] ?? null)}
                    aria-invalid={isInvalid}
                    required
                  />
                  <FieldDescription>
                    Required columns: match_number, r1, r2, r3, b1, b2, b3
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Importing..." : "Import event"}
              </Button>
            )}
          </form.Subscribe>

          {message && (
            <p
              className={
                message.type === "error"
                  ? "text-sm text-destructive"
                  : "text-sm text-muted-foreground"
              }
            >
              {message.text}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
