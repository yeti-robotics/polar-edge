"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";

// ScheduleForm was removed or moved — provide a small local placeholder so
// the dialog builds correctly. Replace this with the real form component
// when the full implementation is restored.
function ScheduleForm({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Schedule form placeholder.
      </p>
      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-white"
          onClick={() => onSuccess?.()}
        >
          Close
        </button>
      </div>
    </div>
  );
}

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
