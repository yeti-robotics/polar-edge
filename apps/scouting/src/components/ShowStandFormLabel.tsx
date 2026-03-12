"use client";

import { Badge } from "@repo/ui/components/badge";

export function ScoutingLabel({
  teamNumber,
  matchNumber,
}: {
  teamNumber?: number;
  matchNumber?: number;
}) {
  if (!teamNumber || !matchNumber)
    return <Badge className="mb-4"> Enter Match Details </Badge>;

  return (
    <Badge className="text-s mb-4">
      Team {teamNumber} • Match {matchNumber}
    </Badge>
  );
}
