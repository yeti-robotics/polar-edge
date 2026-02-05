"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { setActiveEventAction } from "./actions";

type EventOption = {
  id: string;
  eventCode: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
};

function formatEventDate(start: Date | string, end: Date | string): string {
  const startD = typeof start === "string" ? new Date(start) : start;
  const endD = typeof end === "string" ? new Date(end) : end;
  const startStr = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(startD);
  const endStr = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(endD);
  return startStr === endStr ? startStr : `${startStr} – ${endStr}`;
}

export function ActiveEventForm({
  organizationId,
  events,
  activeEventId,
}: {
  organizationId: string;
  events: EventOption[];
  activeEventId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(formData: FormData) {
    const eventId = formData.get("eventId") as string | null;
    if (!eventId) return;

    const result = await setActiveEventAction(organizationId, eventId);
    if (result.error) {
      return;
    }
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Event</CardTitle>
        <CardDescription>
          Choose the event that your organization is currently focused on. This can be used as the
          default event across the app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <input
            ref={hiddenInputRef}
            type="hidden"
            name="eventId"
            defaultValue={activeEventId ?? ""}
          />
          <div className="flex-1 space-y-2">
            <label htmlFor="event-select" className="text-sm font-medium">
              Event
            </label>
            <Select
              name="event-select"
              defaultValue={activeEventId ?? undefined}
              onValueChange={(value) => {
                if (hiddenInputRef.current) hiddenInputRef.current.value = value;
              }}
            >
              <SelectTrigger id="event-select" className="w-full sm:w-[320px]">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.name} — {ev.eventCode} · {formatEventDate(ev.startDate, ev.endDate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
