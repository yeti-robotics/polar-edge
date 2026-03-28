"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { ScheduleForm } from "./ScheduleForm";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ScheduleDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Scouting Schedule</DialogTitle>
        </DialogHeader>

        <ScheduleForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
