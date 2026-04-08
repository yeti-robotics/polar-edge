"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import { useMemo } from "react";
import {
  type ShiftScheduleEntry,
  type ShiftScheduleMatchBlock,
} from "@/features/shift-schedule/types";
import { AdminScheduleButton } from "./AdminScheduleButton";
import { AssignmentsList } from "./AssignmentsList";
import { AssignmentsSpreadsheet } from "./AssignmentsSpreadsheet";
import { ShiftScheduleSummary } from "./ShiftScheduleSummary";

type OrganizationMemberOption = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
};

type Props = {
  activeMemberId: string;
  eventName: string;
  initialEntries: ShiftScheduleEntry[];
  isAdmin: boolean;
  matchBlocks: ShiftScheduleMatchBlock[];
  organizationMembers: OrganizationMemberOption[];
};

export function ShiftSchedulePage({
  activeMemberId,
  eventName,
  initialEntries,
  isAdmin,
  matchBlocks,
  organizationMembers,
}: Props) {
  const sortedEntries = useMemo(
    () =>
      [...initialEntries].sort((a, b) => {
        const startA = a.matchStart ?? 0;
        const startB = b.matchStart ?? 0;
        if (startA !== startB) {
          return startA - startB;
        }

        return (a.name || "").localeCompare(b.name || "");
      }),
    [initialEntries]
  );

  const myEntries = sortedEntries.filter((entry) => entry.memberId === activeMemberId);
  const scheduledScoutCount = new Set(sortedEntries.map((entry) => entry.memberId).filter(Boolean))
    .size;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Scouting Schedule</CardTitle>
            <TypographyMuted>Assign scouts for {eventName}.</TypographyMuted>
          </div>
          {isAdmin ? (
            <AdminScheduleButton
              initialEntries={sortedEntries}
              organizationMembers={organizationMembers}
              matchBlocks={matchBlocks}
            />
          ) : null}
        </CardHeader>
        <CardContent></CardContent>
      </Card>

      <ShiftScheduleSummary
        assignmentCount={sortedEntries.length}
        scheduledScoutCount={scheduledScoutCount}
        myAssignmentCount={myEntries.length}
      />

      <AssignmentsList
        title="Your Schedule"
        description="These are the assignments currently tied to your organization."
        entries={myEntries}
        emptyMessage="You do not have any assignments for the active event yet."
      />

      {isAdmin ? (
        <AssignmentsSpreadsheet
          title="Organization Schedule"
          description="Spreadsheet view of scouts by match block so admins can see coverage at a glance."
          entries={sortedEntries}
          emptyMessage="No schedule has been published yet. Use Manage Schedule to add assignments."
        />
      ) : (
        <AssignmentsList
          title="Organization Schedule"
          description="Everyone in the organization can use this view to see who is covering what."
          entries={sortedEntries}
          emptyMessage="No schedule has been published for the active event yet."
        />
      )}
    </div>
  );
}
