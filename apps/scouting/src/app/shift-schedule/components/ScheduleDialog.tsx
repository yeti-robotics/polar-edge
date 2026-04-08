"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import type { ShiftScheduleEntry, ShiftScheduleMatchBlock } from "@/features/shift-schedule/types";
import { ScheduleForm } from "./ScheduleForm";

type OrganizationMemberOption = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEntries: ShiftScheduleEntry[];
  organizationMembers: OrganizationMemberOption[];
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
