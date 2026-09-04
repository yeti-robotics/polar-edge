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
import { useEffect, useState, useTransition } from "react";
import { updateCoprFallbackAction } from "../actions";

export function CoprFallbackSettingsForm({
  organizationId,
  enabled,
}: {
  organizationId: string;
  enabled: boolean;
}) {
  const [checked, setChecked] = useState(enabled);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setChecked(enabled);
  }, [enabled]);

  const handleCheckedChange = (nextChecked: boolean) => {
    const previousChecked = checked;
    setChecked(nextChecked);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("organizationId", organizationId);
      formData.set("coprFallbackEnabled", String(nextChecked));

      try {
        const result = await updateCoprFallbackAction({ data: null, error: null }, formData);
        if (result.error) {
          setChecked(previousChecked);
          toast.error(result.error);
          return;
        }

        toast.success(`Manual shooting-rate fallback ${nextChecked ? "enabled" : "disabled"}`);
      } catch {
        setChecked(previousChecked);
        toast.error("Failed to update COPR fallback");
      }
    });
  };

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
          <Switch
            id="copr-fallback-enabled"
            checked={checked}
            onCheckedChange={handleCheckedChange}
            disabled={isPending}
            aria-describedby="copr-fallback-status"
          />
          <div className="space-y-1">
            <Label htmlFor="copr-fallback-enabled">Manual shooting-rate fallback</Label>
            <p
              id="copr-fallback-status"
              className="text-sm text-muted-foreground"
              aria-live="polite"
            >
              {isPending ? "Saving…" : checked ? "On" : "Off"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
