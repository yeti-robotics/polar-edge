"use client";

import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { CheckCircleIcon } from "lucide-react";
import { useState } from "react";

type EndClimbDialogProps = {
  onComplete: (climbLevel: number, climbSuccess: boolean) => void;
  onOpen?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
};

/**
 * Dialog to end a climb and collect level + success.
 * Logic:
 * - Level 0 (No Climb) + attempted checkbox = { climbLevel: 0, climbSuccess: false }
 * - Level 0 (No Climb) + not attempted = Cancel action (don't create record)
 * - Level 1/2/3 = { climbLevel: 1|2|3, climbSuccess: true } (assume success)
 */
export function EndClimbDialog({ onComplete, onOpen, onCancel, disabled = false }: EndClimbDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [attempted, setAttempted] = useState(false);

  // onOpenChange is only called by Radix for user interactions (ESC, backdrop),
  // not for programmatic setOpen(false) calls.
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) onOpen?.();
    else onCancel?.();
    setOpen(isOpen);
  };

  const handleConfirm = () => {
    if (!selectedLevel) return;

    const level = parseInt(selectedLevel, 10);

    if (level === 0 && !attempted) {
      // No climb and not attempted: just close dialog (don't record anything)
      onCancel?.();
      handleClose();
      return;
    }

    if (level === 0) {
      // No climb but attempted: record as failed attempt
      onComplete(0, false);
    } else {
      // Level 1/2/3: assume success
      onComplete(level, true);
    }

    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedLevel("");
    setAttempted(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full h-full" disabled={disabled}>
          <CheckCircleIcon className="mr-2 h-5 w-5" />
          End Climb
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End Climb</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Label>Climb Level</Label>
          <RadioGroup value={selectedLevel} onValueChange={setSelectedLevel}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="0" id="climb-level-0" />
              <Label htmlFor="climb-level-0" className="cursor-pointer">
                No Climb
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="1" id="climb-level-1" />
              <Label htmlFor="climb-level-1" className="cursor-pointer">
                L1
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2" id="climb-level-2" />
              <Label htmlFor="climb-level-2" className="cursor-pointer">
                L2
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="3" id="climb-level-3" />
              <Label htmlFor="climb-level-3" className="cursor-pointer">
                L3
              </Label>
            </div>
          </RadioGroup>

          {selectedLevel === "0" && (
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="attempted"
                checked={attempted}
                onCheckedChange={(checked) => setAttempted(checked === true)}
              />
              <Label htmlFor="attempted" className="cursor-pointer">
                Climb Attempted (failed)
              </Label>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => { onCancel?.(); handleClose(); }}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleConfirm} disabled={!selectedLevel}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
