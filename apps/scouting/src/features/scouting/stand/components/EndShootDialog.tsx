"use client";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { CheckCircleIcon } from "lucide-react";
import { useState } from "react";

type EndShootDialogProps = {
  onComplete: () => void;
  onOpen?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
};

/**
 * Dialog to confirm ending a shooting cycle.
 * BPS is now derived from TBA Component OPRs instead of manual bucket selection.
 */
export function EndShootDialog({
  onComplete,
  onOpen,
  onCancel,
  disabled = false,
}: EndShootDialogProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) onOpen?.();
    else onCancel?.();
    setOpen(isOpen);
  };

  const handleConfirm = () => {
    onComplete();
    setOpen(false);
  };

  const handleCancel = () => {
    onCancel?.();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full h-full" disabled={disabled}>
          <CheckCircleIcon className="mr-2 h-5 w-5" />
          End Shoot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End Shooting Cycle</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Confirm to end this shooting cycle. Duration will be recorded.
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
