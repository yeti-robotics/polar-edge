"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { Switch } from "@repo/ui/components/switch";
import { useForm } from "@tanstack/react-form-nextjs";
import { useEffect } from "react";
import { updateCoprFallbackAction } from "../actions";

export function CoprFallbackSettingsForm({
  organizationId,
  enabled,
}: {
  organizationId: string;
  enabled: boolean;
}) {
  const form = useForm({
    defaultValues: { enabled },
    onSubmit: async ({ value }) => {
      try {
        const result = await updateCoprFallbackAction(organizationId, value.enabled);
        if (result.error) {
          form.reset();
          toast.error(result.error);
          return;
        }

        form.reset(value);
        toast.success(`Manual shooting-rate fallback ${value.enabled ? "enabled" : "disabled"}`);
      } catch {
        form.reset();
        toast.error("Failed to update COPR fallback");
      }
    },
  });

  useEffect(() => {
    form.reset({ enabled });
  }, [enabled, form]);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>COPR Fallback</CardTitle>
        <CardDescription>
          When TBA has no COPR data for a team, ask scouts to estimate its shooting rate. Changes
          save automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <form.Field name="enabled">
            {(field) => (
              <Switch
                id="copr-fallback-enabled"
                checked={field.state.value}
                onCheckedChange={(checked) => {
                  field.handleChange(checked);
                  void form.handleSubmit();
                }}
                disabled={form.state.isSubmitting}
                aria-describedby="copr-fallback-status"
              />
            )}
          </form.Field>
          <div className="space-y-1">
            <Label htmlFor="copr-fallback-enabled">Manual shooting-rate fallback</Label>
            <p
              id="copr-fallback-status"
              className="text-sm text-muted-foreground"
              aria-live="polite"
            >
              <form.Subscribe selector={(state) => [state.values.enabled, state.isSubmitting]}>
                {([checked, isSubmitting]) => (isSubmitting ? "Saving…" : checked ? "On" : "Off")}
              </form.Subscribe>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
