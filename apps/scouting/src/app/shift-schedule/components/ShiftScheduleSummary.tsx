"use client";

import { Card, CardContent } from "@repo/ui/components/card";

type Props = {
  assignmentCount: number;
  scheduledScoutCount: number;
  myAssignmentCount: number;
};

export function ShiftScheduleSummary({
  assignmentCount,
  scheduledScoutCount,
  myAssignmentCount,
}: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card>
        <CardContent className="py-5">
          <p className="text-sm text-muted-foreground">Assignments</p>
          <p className="mt-2 text-3xl font-semibold">{assignmentCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-5">
          <p className="text-sm text-muted-foreground">Scheduled Scouts</p>
          <p className="mt-2 text-3xl font-semibold">{scheduledScoutCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-5">
          <p className="text-sm text-muted-foreground">Your Assignments</p>
          <p className="mt-2 text-3xl font-semibold">{myAssignmentCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
