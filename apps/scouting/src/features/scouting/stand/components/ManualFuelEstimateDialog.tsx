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
import { CheckCircleIcon } from "lucide-react";
import { useState } from "react";

const BUCKETS = [
  { value: "0", label: "No shot (0 balls/sec)" },
  { value: "1", label: "Slow (0–1.5 balls/sec)" },
  { value: "2", label: "Medium-slow (1.5–3 balls/sec)" },
  { value: "3", label: "Medium (3–5 balls/sec)" },
  { value: "4", label: "Fast (5–7 balls/sec)" },
  { value: "5", label: "Very fast (7+ balls/sec)" },
] as const;

export function ManualFuelEstimateDialog({
  onComplete,
  onOpen,
  onCancel,
}: {
  onComplete: (bucket: number) => void;
  onOpen?: () => void;
  onCancel?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) onOpen?.();
    else onCancel?.();
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelectedBucket("");
    }
  };

  const handleConfirm = () => {
    if (!selectedBucket) return;
    onComplete(Number(selectedBucket));
    setOpen(false);
    setSelectedBucket("");
  };

  const handleCancel = () => {
    onCancel?.();
    setOpen(false);
    setSelectedBucket("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="h-full">
          <CheckCircleIcon className="mr-2 h-5 w-5" />
          End Shoot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End Shooting Cycle</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          TBA does not have COPR data for this team. Choose the closest observed rate.
        </p>
        <div className="space-y-4">
          <Label>Balls/Second Estimate</Label>
          <RadioGroup value={selectedBucket} onValueChange={setSelectedBucket}>
            {BUCKETS.map((bucket) => (
              <div key={bucket.value} className="flex items-center gap-2">
                <RadioGroupItem value={bucket.value} id={`fuel-bucket-${bucket.value}`} />
                <Label htmlFor={`fuel-bucket-${bucket.value}`} className="cursor-pointer">
                  {bucket.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedBucket}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
