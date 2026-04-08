import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { useState } from "react";
import type { SessionPerformance } from "@/services/tracker/types";

const PERFORMANCE_OPTIONS: { value: SessionPerformance; label: string; color: string }[] = [
  { value: "excellent", label: "Excellent", color: "border-emerald-500 bg-emerald-500/10 text-emerald-500" },
  { value: "good", label: "Good", color: "border-emerald-500/50 bg-emerald-500/5 text-emerald-400" },
  { value: "ok", label: "OK", color: "border-amber-500 bg-amber-500/10 text-amber-500" },
  { value: "poor", label: "Poor", color: "border-red-500 bg-red-500/10 text-red-500" },
];

interface CheckInDialogProps {
  sessionId: string;
  batteryName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckIn: (
    sessionId: string,
    performance: SessionPerformance,
    hadBrownout: boolean,
    brownoutTiming: string | null,
    notes: string
  ) => Promise<void>;
}

export function CheckInDialog({ sessionId, batteryName, open, onOpenChange, onCheckIn }: CheckInDialogProps) {
  const [performance, setPerformance] = useState<SessionPerformance | null>(null);
  const [hadBrownout, setHadBrownout] = useState<boolean | null>(null);
  const [brownoutTiming, setBrownoutTiming] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!performance || hadBrownout === null) return;
    await onCheckIn(
      sessionId,
      performance,
      hadBrownout,
      hadBrownout ? brownoutTiming.trim() || null : null,
      notes.trim()
    );
    setPerformance(null);
    setHadBrownout(null);
    setBrownoutTiming("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Performance</DialogTitle>
          <DialogDescription>
            Recording results for <strong>{batteryName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Overall Performance</Label>
            <div className="flex flex-wrap gap-2">
              {PERFORMANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPerformance(opt.value)}
                  className={`rounded-md border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                    performance === opt.value
                      ? opt.color
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Did it brownout?</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHadBrownout(false)}
                className={`rounded-md border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                  hadBrownout === false
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setHadBrownout(true)}
                className={`rounded-md border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                  hadBrownout === true
                    ? "border-red-500 bg-red-500/10 text-red-500"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Yes
              </button>
            </div>
          </div>

          {hadBrownout && (
            <div className="grid gap-2">
              <Label htmlFor="ci-brownout-time">When did it brownout?</Label>
              <Input
                id="ci-brownout-time"
                placeholder="e.g. 45 sec in, end of auto, 1:20..."
                value={brownoutTiming}
                onChange={(e) => setBrownoutTiming(e.target.value)}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="ci-notes">Notes</Label>
            <Textarea
              id="ci-notes"
              placeholder="Anything notable about this session..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!performance || hadBrownout === null}>
            Log & Check In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
