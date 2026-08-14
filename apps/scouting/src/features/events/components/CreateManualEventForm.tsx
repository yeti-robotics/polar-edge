"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useForm } from "@tanstack/react-form-nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createManualEventAction } from "../actions";

type Message = {
  type: "success" | "error";
  text: string;
};

const required = (label: string) => ({ value }: { value: string }) =>
  value.trim().length === 0 ? `${label} is required` : undefined;

export function CreateManualEventForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);

  const form = useForm({
    defaultValues: {
      eventCode: "",
      name: "",
      startDate: "",
      endDate: "",
      csvFile: null as File | null,
    },
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
          await value.csvFile.text(),
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
          Create an offseason event and upload its complete qualification match
          schedule.
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
            <form.Field
              name="eventCode"
              validators={{ onBlur: required("Event code") }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Event code</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="e.g. 2026thorwest"
                    aria-invalid={!field.state.meta.isValid}
                    required
                  />
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.map((error) => (
                      <p key={String(error)} className="text-sm text-destructive">
                        {String(error)}
                      </p>
                    ))}
                </div>
              )}
            </form.Field>

            <form.Field
              name="name"
              validators={{ onBlur: required("Event name") }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Event name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="e.g. THOR West 2026"
                    aria-invalid={!field.state.meta.isValid}
                    required
                  />
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.map((error) => (
                      <p key={String(error)} className="text-sm text-destructive">
                        {String(error)}
                      </p>
                    ))}
                </div>
              )}
            </form.Field>

            <form.Field
              name="startDate"
              validators={{ onBlur: required("Start date") }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Start date</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={!field.state.meta.isValid}
                    required
                  />
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.map((error) => (
                      <p key={String(error)} className="text-sm text-destructive">
                        {String(error)}
                      </p>
                    ))}
                </div>
              )}
            </form.Field>

            <form.Field
              name="endDate"
              validators={{
                onBlur: ({ value, fieldApi }) => {
                  if (value.trim().length === 0) return "End date is required";
                  const startDate = fieldApi.form.getFieldValue("startDate");
                  return startDate && value < startDate
                    ? "End date must be on or after the start date"
                    : undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>End date</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={!field.state.meta.isValid}
                    required
                  />
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.map((error) => (
                      <p key={String(error)} className="text-sm text-destructive">
                        {String(error)}
                      </p>
                    ))}
                </div>
              )}
            </form.Field>
          </div>

          <form.Field
            name="csvFile"
            validators={{
              onChange: ({ value }) =>
                value === null ? "A CSV file is required" : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Match-schedule CSV</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="file"
                  accept=".csv,text/csv"
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.target.files?.[0] ?? null)
                  }
                  aria-invalid={!field.state.meta.isValid}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Required columns: match_number, r1, r2, r3, b1, b2, b3
                </p>
                {field.state.meta.isTouched &&
                  field.state.meta.errors.map((error) => (
                    <p key={String(error)} className="text-sm text-destructive">
                      {String(error)}
                    </p>
                  ))}
              </div>
            )}
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
