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
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { syncEventFromTBAAction } from "./actions";

export function SyncFromTBAForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tbaEventKey, setTbaEventKey] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const key = tbaEventKey.trim();
    if (!key) {
      setMessage({ type: "error", text: "Enter a TBA event key (e.g. 2025ncwak)" });
      return;
    }

    const result = await syncEventFromTBAAction(organizationId, key);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    const data = result.data;
    const parts: string[] = [];
    if (data?.matchCount !== undefined) parts.push(`${data.matchCount} qualifying match(es)`);
    if (data?.teamMatchCount !== undefined)
      parts.push(`${data.teamMatchCount} team-match assignment(s)`);
    setMessage({
      type: "success",
      text: parts.length > 0 ? `Event synced. ${parts.join(", ")}.` : "Event synced.",
    });
    setTbaEventKey("");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync from TBA</CardTitle>
        <CardDescription>
          Import an event and its qualifying matches from The Blue Alliance. Enter the TBA event key
          (e.g. 2025ncwak).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="tba-event-key">TBA event key</Label>
            <Input
              id="tba-event-key"
              type="text"
              placeholder="e.g. 2025ncwak"
              value={tbaEventKey}
              onChange={(e) => setTbaEventKey(e.target.value)}
              className="sm:max-w-50"
              disabled={isPending}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Syncing..." : "Sync event"}
          </Button>
        </form>
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
