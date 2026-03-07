"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useRouter, useSearchParams } from "next/navigation";

type EventOption = {
  id: string;
  name: string;
  eventCode: string;
};

export function EventSwitcher({
  events,
  selectedEventId,
}: {
  events: EventOption[];
  selectedEventId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(eventId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("eventId", eventId);
    router.push(`?${params.toString()}`);
  }

  return (
    <Select value={selectedEventId} onValueChange={handleChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select event" />
      </SelectTrigger>
      <SelectContent>
        {events.map((e) => (
          <SelectItem key={e.id} value={e.id}>
            {e.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
