"use client";

import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { useState } from "react";

type EndShootDialogProps = {
  onComplete: (bucket: number) => void;
  disabled?: boolean;
};

/**
 * Dialog to end a shooting cycle and select bucket (0-5).
 * Bucket labels match schema:
 * - 0: No shot (0 balls/sec)
 * - 1: Slow (0-1.5 balls/sec)
 * - 2: Medium-Slow (1.5-3 balls/sec)
 * - 3: Medium (3-5 balls/sec)
 * - 4: Fast (5-7 balls/sec)
 * - 5: Very Fast (7+ balls/sec)
 */
export function EndShootDialog({ onComplete, disabled = false }: EndShootDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<string>("");

  const handleConfirm = () => {
    if (!selectedBucket) return;
    onComplete(parseInt(selectedBucket, 10));
    setOpen(false);
    setSelectedBucket("");
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedBucket("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full h-full" disabled={disabled}>
          Shoot End
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End Shooting Cycle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Label htmlFor="bucket-select">Balls/Second Estimate</Label>
          <RadioGroup
            id="bucket-select"
            value={selectedBucket}
            onValueChange={setSelectedBucket}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="0" id="bucket-0" />
              <Label htmlFor="bucket-0" className="cursor-pointer">
                No shot (0 balls/sec)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="1" id="bucket-1" />
              <Label htmlFor="bucket-1" className="cursor-pointer">
                Slow (0-1.5 balls/sec)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2" id="bucket-2" />
              <Label htmlFor="bucket-2" className="cursor-pointer">
                Medium-Slow (1.5-3 balls/sec)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="3" id="bucket-3" />
              <Label htmlFor="bucket-3" className="cursor-pointer">
                Medium (3-5 balls/sec)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="4" id="bucket-4" />
              <Label htmlFor="bucket-4" className="cursor-pointer">
                Fast (5-7 balls/sec)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="5" id="bucket-5" />
              <Label htmlFor="bucket-5" className="cursor-pointer">
                Very Fast (7+ balls/sec)
              </Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleConfirm} disabled={!selectedBucket}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
