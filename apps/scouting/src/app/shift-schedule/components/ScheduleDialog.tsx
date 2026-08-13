"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Button
} from "@repo/ui/components/button";

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
        <Button
          variant="outline"
          onClick={() => onSuccess?.()}
        >
          Close
        </Button>
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
