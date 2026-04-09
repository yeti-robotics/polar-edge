"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import type {
  ShiftScheduleEntry,
  ShiftScheduleMatchBlock,
  ShiftScheduleMemberOption,
} from "@/features/shift-schedule/types";
import { ScheduleForm } from "./ScheduleForm";
import { ShiftScheduleSummary } from "./ShiftScheduleSummary";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEntries: ShiftScheduleEntry[];
  organizationMembers: ShiftScheduleMemberOption[];
  matchBlocks: ShiftScheduleMatchBlock[];
};

export function ScheduleDialog({
  open,
  onOpenChange,
  initialEntries,
  organizationMembers,
  matchBlocks,
}: Props) {
  const scheduledScoutCount = new Set(
    initialEntries.map((entry) => entry.memberId).filter(Boolean),
  ).size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <DialogTitle>Scouting Schedule</DialogTitle>
            <DialogDescription>
              Assign organization members to stand scouting.
            </DialogDescription>
          </div>
          <ShiftScheduleSummary
            scheduledScoutCount={scheduledScoutCount}
            variant="compact"
          />
        </DialogHeader>

        <ScheduleForm
          onSuccess={() => onOpenChange(false)}
          initialEntries={initialEntries}
          organizationMembers={organizationMembers}
          matchBlocks={matchBlocks}
        />
      </DialogContent>
    </Dialog>
  );
}
