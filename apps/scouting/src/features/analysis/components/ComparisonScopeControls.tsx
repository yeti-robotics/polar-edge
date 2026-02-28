"use client";

import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import { useRouter, useSearchParams } from "next/navigation";

export type EventOption = { id: string; name: string; eventCode: string };

type Props = {
  hasOrg: boolean;
  globalEvents: EventOption[];
  orgEvents: EventOption[];
};

export function ComparisonScopeControls({ hasOrg, globalEvents, orgEvents }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgScope = searchParams.get("orgScope") === "1";
  const eventId = searchParams.get("eventId") ?? "";

  const events = orgScope && hasOrg ? orgEvents : globalEvents;

  const handleOrgScopeChange = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("eventId");
    if (checked) {
      params.set("orgScope", "1");
    } else {
      params.delete("orgScope");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleEventChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "__all__") {
      params.delete("eventId");
    } else {
      params.set("eventId", value);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {hasOrg && (
        <div className="flex items-center gap-2">
          <Label htmlFor="comparison-org-scope" className="text-sm text-muted-foreground">
            My Organization Only
          </Label>
          <Switch
            id="comparison-org-scope"
            size="sm"
            checked={orgScope}
            onCheckedChange={handleOrgScopeChange}
          />
        </div>
      )}
      <Select
        disabled={events.length === 0}
        value={eventId || "__all__"}
        onValueChange={handleEventChange}
      >
        <SelectTrigger size="sm" className="w-48">
          <SelectValue placeholder={events.length === 0 ? "No events" : "All events"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All events</SelectItem>
          {events.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name} ({e.eventCode})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
