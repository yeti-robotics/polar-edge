import { Card, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import type { ReactNode } from "react";
import { type ShiftScheduleEntry } from "@/features/shift-schedule/types";
import { AssignmentsList } from "./AssignmentsList";
import { AssignmentsSpreadsheet } from "./AssignmentsSpreadsheet";

type Props = {
  activeMemberId: string;
  adminAction?: ReactNode;
  eventName: string;
  initialEntries: ShiftScheduleEntry[];
};

export function ShiftSchedulePage({
  activeMemberId,
  adminAction,
  eventName,
  initialEntries,
}: Props) {
  const sortedEntries = [...initialEntries].sort((a, b) => {
    const startA = a.matchStart ?? 0;
    const startB = b.matchStart ?? 0;
    if (startA !== startB) {
      return startA - startB;
    }

    return (a.name || "").localeCompare(b.name || "");
  });

  const myEntries = sortedEntries.filter(
    (entry) => entry.memberId === activeMemberId,
  );
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Scouting Schedule</CardTitle>
            <TypographyMuted>Assign scouts for {eventName}.</TypographyMuted>
          </div>
          {adminAction}
        </CardHeader>
      </Card>

      <AssignmentsList
        title="Your Schedule"
        description="These are the assignments currently tied to your organization."
        entries={myEntries}
        emptyMessage="You do not have any assignments for the active event yet."
      />

      <AssignmentsSpreadsheet
        title="Organization Schedule"
        description="Spreadsheet view of scouts by match block so everyone can see coverage at a glance."
        entries={sortedEntries}
        emptyMessage="No schedule has been published for the active event yet."
      />
    </div>
  );
}
