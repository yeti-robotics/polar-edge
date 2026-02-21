"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enrichTeamNamesAction } from "./actions";

export function EnrichTeamNamesForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleClick() {
    setMessage(null);
    const result = await enrichTeamNamesAction(organizationId);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    const count = result.data?.enrichedCount ?? 0;
    setMessage({
      type: "success",
      text: count > 0 ? `Enriched ${count} team name(s) from TBA.` : "All team names are already filled in.",
    });
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrich team names</CardTitle>
        <CardDescription>
          Fetch team names from TBA for any teams that were synced without one. Run this once TBA
          has team information listed for the event.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleClick} disabled={isPending} variant="outline">
          {isPending ? "Fetching names..." : "Enrich team names"}
        </Button>
        {message && (
          <p
            className={
              message.type === "error"
                ? "mt-4 text-sm text-destructive"
                : "mt-4 text-sm text-muted-foreground"
            }
          >
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
