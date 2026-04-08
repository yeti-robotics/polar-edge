import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useState } from "react";
import type { FleetBattery } from "@/services/tracker/types";

interface CheckOutDialogProps {
  availableBatteries: FleetBattery[];
  onCheckOut: (batteryId: string, batteryName: string, kw700: number | null, voltage: number | null) => Promise<void>;
  preselectedId?: string;
}

export function CheckOutDialog({ availableBatteries, onCheckOut, preselectedId }: CheckOutDialogProps) {
  const [open, setOpen] = useState(false);
  const [batteryId, setBatteryId] = useState(preselectedId ?? "");
  const [kw700, setKw700] = useState("");
  const [voltage, setVoltage] = useState("");

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setBatteryId(preselectedId ?? availableBatteries[0]?.id ?? "");
      setKw700("");
      setVoltage("");
    }
  };

  const handleSubmit = async () => {
    const battery = availableBatteries.find((b) => b.id === batteryId);
    if (!battery) return;
    await onCheckOut(
      battery.id,
      battery.name,
      kw700 ? Number.parseFloat(kw700) : null,
      voltage ? Number.parseFloat(voltage) : null
    );
    setOpen(false);
  };

  if (availableBatteries.length === 0) {
    return (
      <Button size="sm" disabled>
        ⚡ Check Out
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm">⚡ Check Out</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check Out Battery</DialogTitle>
          <DialogDescription>Select a battery and record initial readings.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Battery</Label>
            <Select value={batteryId} onValueChange={setBatteryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select battery" />
              </SelectTrigger>
              <SelectContent>
                {availableBatteries.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="co-kw700">KW700 (mΩ)</Label>
              <Input
                id="co-kw700"
                type="number"
                step="0.1"
                placeholder="e.g. 15.0"
                value={kw700}
                onChange={(e) => setKw700(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="co-voltage">Voltage (V)</Label>
              <Input
                id="co-voltage"
                type="number"
                step="0.01"
                placeholder="e.g. 12.65"
                value={voltage}
                onChange={(e) => setVoltage(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!batteryId}>
            Check Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
