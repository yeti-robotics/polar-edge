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
import { useState } from "react";
import { createManualEventAction } from "../actions";

type Message = {
  type: "success" | "error";
  text: string;
};

export function CreateManualEventForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();

  const [eventCode, setEventCode] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    if (!csvFile) {
      setMessage({
        type: "error",
        text: "Select a CSV File to uplaod into the eventu",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const csvText = await csvFile.text();
      const result = await createManualEventAction(
        organizationId,
        {
          eventCode,
          name,
          startDate,
          endDate,
        },
        csvText
      );
      if (result.error) {
        setMessage({
          type: "error",
          text: result.error,
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Event created successfully",
      });

      setEventCode("");
      setName("");
      setStartDate("");
      setEndDate("");
      setCsvFile(null);

      router.refresh();
    } catch (e) {
      console.error(e);
      setMessage({
        type: "error",
        text: "Failed to create event",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create manual event</CardTitle>
        <CardDescription>
          Create an offseason event and upload its complete qualification match schedule.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manual-event-code">Event code</Label>
              <Input
                id="manual-event-code"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                placeholder="e.g. 2026thorwest"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-event-name">Event name</Label>
              <Input
                id="manual-event-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. THOR West 2026"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-start-date">Start date</Label>
              <Input
                id="manual-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-end-date">End date</Label>
              <Input
                id="manual-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-schedule">Match-schedule CSV</Label>
            <Input
              id="manual-schedule"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              disabled={isSubmitting}
              required
            />
            <p className="text-sm text-muted-foreground">
              Required columns: match_number, r1, r2, r3, b1, b2, b3
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Importing..." : "Import event"}
          </Button>

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
