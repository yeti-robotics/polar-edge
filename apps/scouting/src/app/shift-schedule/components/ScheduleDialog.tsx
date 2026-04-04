"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import type { ShiftScheduleEntry } from "@/features/shift-schedule/types";
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
};

export function ScheduleDialog({
  open,
  onOpenChange,
  initialEntries,
  organizationMembers,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Scouting Assignments</DialogTitle>
          <DialogDescription>
            Assign scouting roles and shifts to members in your organization for the active event.
          </DialogDescription>
        </DialogHeader>

        <ScheduleForm
          onSuccess={() => onOpenChange(false)}
          initialEntries={initialEntries}
          organizationMembers={organizationMembers}
        />
      </DialogContent>
    </Dialog>
  );
}
