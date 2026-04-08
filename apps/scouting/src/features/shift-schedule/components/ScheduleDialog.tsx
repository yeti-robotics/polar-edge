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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Scouting Schedule</DialogTitle>
          <DialogDescription>
            Assign organization members to stand scouting blocks for the active event.
          </DialogDescription>
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
