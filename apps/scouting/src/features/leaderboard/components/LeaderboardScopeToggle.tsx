"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useRouter, useSearchParams } from "next/navigation";

type OrgEvent = {
  id: string;
  name: string;
  eventCode: string;
  isActive: boolean | null;
};

type Props = {
  orgEvents: OrgEvent[];
  currentEventParam: string | null;
};

export function LeaderboardScopeToggle({ orgEvents, currentEventParam }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleEventChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "__active__") {
      params.delete("event");
    } else {
      params.set("event", value);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const selectedValue = currentEventParam ?? "__active__";

  return (
    <Select value={selectedValue} onValueChange={handleEventChange}>
      <SelectTrigger size="sm" className="w-52">
        <SelectValue placeholder="Select scope" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__active__">Active event</SelectItem>
        <SelectItem value="all">All time</SelectItem>
        {orgEvents.map((e) => (
          <SelectItem key={e.id} value={e.id}>
            {e.name} ({e.eventCode})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
