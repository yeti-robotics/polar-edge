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

type TeamEvent = { id: string; name: string; eventCode: string };

type Props = {
  hasOrg: boolean;
  globalTeamEvents: TeamEvent[];
  orgTeamEvents: TeamEvent[];
};

export function TeamScopeControls({ hasOrg, globalTeamEvents, orgTeamEvents }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgScope = searchParams.get("orgScope") === "1";
  const eventId = searchParams.get("eventId") ?? "";

  const teamEvents = orgScope && hasOrg ? orgTeamEvents : globalTeamEvents;

  const handleOrgScopeChange = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    // Clear eventId when toggling scope since the event lists differ
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
    <div className="flex items-center gap-4 min-w-0">
      {hasOrg && (
        <div className="flex items-center gap-2">
          <Label htmlFor="org-scope" className="text-sm text-muted-foreground">
            My Organization Only
          </Label>
          <Switch
            id="org-scope"
            size="sm"
            checked={orgScope}
            onCheckedChange={handleOrgScopeChange}
          />
        </div>
      )}
      <Select
        disabled={teamEvents.length === 0}
        value={eventId || "__all__"}
        onValueChange={handleEventChange}
      >
        <SelectTrigger size="sm" className="w-full min-w-0 sm:w-48">
          <SelectValue placeholder={teamEvents.length === 0 ? "No events" : "All events"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All events</SelectItem>
          {teamEvents.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name} ({e.eventCode})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
