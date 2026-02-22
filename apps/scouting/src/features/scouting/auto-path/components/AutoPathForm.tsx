"use client";

import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useForm } from "@tanstack/react-form-nextjs";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { z } from "zod";
import { routes } from "@/lib/routes";
import { createAutoPath, type getTeams as GetTeamsType } from "../actions";
import { PathCanvas, type PathData } from "./PathCanvas";

const autoPathSchema = z.object({
  teamNumber: z.number().int().positive("Team number is required"),
  name: z.string().min(1, "Name is required"),
  pathData: z.object({
    points: z.array(
      z.object({
        x: z.number(),
        y: z.number(),
        timestamp: z.number(),
      })
    ),
  }),
  hasL1Climb: z.boolean(),
  fieldImageUrl: z.string().nullable(),
});

interface AutoPathFormProps {
  teams: Awaited<ReturnType<typeof GetTeamsType>>;
  onSuccess?: () => void;
}

export function AutoPathForm({ teams, onSuccess }: AutoPathFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pathData, setPathData] = useState<PathData | null>(null);

  const form = useForm({
    defaultValues: {
      teamNumber: 0,
      name: "",
      pathData: {
        points: [] as Array<{ x: number; y: number; timestamp: number }>,
      },
      hasL1Climb: false as boolean,
      fieldImageUrl: null as string | null,
    },
    onSubmit: async ({ value }) => {
      console.log(value);
      setIsSubmitting(true);
      setError(null);

      try {
        // Validate form data
        const validationResult = autoPathSchema.safeParse(value);
        if (!validationResult.success) {
          setError(validationResult.error.issues[0]?.message ?? "Validation failed");
          setIsSubmitting(false);
          return;
        }

        if (!pathData || pathData.points.length === 0) {
          setError("Please draw a path on the canvas");
          setIsSubmitting(false);
          return;
        }

        await createAutoPath({
          ...value,
          name: value.name ?? "",
          pathData,
          fieldImageUrl: null,
        });

        if (onSuccess) {
          onSuccess();
        } else {
          router.push(routes.autoPath.root);
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save auto path");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handlePathChange = useCallback(
    (data: PathData) => {
      setPathData(data);
      form.setFieldValue("pathData", data);
    },
    [form]
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <form.Field
        name="teamNumber"
        validators={{
          onBlur: z.number().int().positive("Team number is required"),
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Team Number</Label>
            <Select
              value={field.state.value > 0 ? field.state.value.toString() : ""}
              onValueChange={(value) => {
                const numValue = Number.parseInt(value, 10);
                if (!Number.isNaN(numValue)) {
                  field.handleChange(numValue);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.teamNumber} value={team.teamNumber.toString()}>
                    {team.teamNumber} - {team.teamName || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {typeof field.state.meta.errors[0] === "string"
                  ? field.state.meta.errors[0]
                  : (field.state.meta.errors[0]?.message ?? "Invalid value")}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="name"
        validators={{
          onBlur: z.string().min(1, "Name is required"),
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Name</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.currentTarget.value);
              }}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {typeof field.state.meta.errors[0] === "string"
                  ? field.state.meta.errors[0]
                  : (field.state.meta.errors[0]?.message ?? "Invalid value")}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <div className="space-y-2">
        <Label>Draw Auto Path</Label>
        <PathCanvas onPathChange={handlePathChange} className="w-full" />
        {pathData && pathData.points.length === 0 && (
          <p className="text-sm text-muted-foreground">Draw a path on the canvas above</p>
        )}
      </div>

      <form.Field name="hasL1Climb">
        {(field) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.name}
              checked={field.state.value}
              onCheckedChange={(checked) => {
                field.handleChange(checked === true);
              }}
            />
            <Label htmlFor={field.name} className="cursor-pointer">
              Has L1 Climb
            </Label>
          </div>
        )}
      </form.Field>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting || !form.state.canSubmit} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Auto Path"
        )}
      </Button>
    </form>
  );
}
