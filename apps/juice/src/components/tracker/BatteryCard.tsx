import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { useState } from "react";
import type { FleetBattery, SessionPerformance } from "@/services/tracker/types";
import { CheckInDialog } from "./CheckInDialog";

interface BatteryCardProps {
  battery: FleetBattery;
  onCheckOut: (
    batteryId: string,
    batteryName: string,
    kw700: number | null,
    voltage: number | null
  ) => Promise<void>;
  onCheckIn: (
    sessionId: string,
    performance: SessionPerformance,
    hadBrownout: boolean,
    brownoutTiming: string | null,
    notes: string
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function perfColor(p: SessionPerformance | null): string {
  if (!p) return "text-muted-foreground";
  if (p === "excellent" || p === "good") return "text-emerald-500";
  if (p === "ok") return "text-amber-500";
  return "text-red-500";
}

function kw700Color(v: number | null): string {
  if (v === null) return "text-muted-foreground";
  if (v < 20) return "text-emerald-500";
  if (v < 40) return "text-amber-500";
  return "text-red-500";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function BatteryCard({ battery, onCheckOut, onCheckIn, onDelete }: BatteryCardProps) {
  const [checkInOpen, setCheckInOpen] = useState(false);

  return (
    <div
      className={`rounded-lg border bg-card p-4 ${
        battery.isInUse ? "border-blue-500/30" : "border-border"
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-semibold">{battery.name}</h3>
        {battery.isInUse && (
          <Badge variant="outline" className="border-blue-500/30 text-blue-500 text-[10px]">
            IN USE
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Last KW700
          </p>
          <p className={`font-mono text-sm font-semibold ${kw700Color(battery.lastKw700)}`}>
            {battery.lastKw700 !== null ? `${battery.lastKw700} mΩ` : "—"}
          </p>
        </div>
        <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Sessions
          </p>
          <p className="font-mono text-sm font-semibold">{battery.sessionCount}</p>
        </div>
        <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Brownouts
          </p>
          <p
            className={`font-mono text-sm font-semibold ${
              battery.brownoutCount > 0
                ? "text-red-500"
                : battery.sessionCount > 0
                  ? "text-emerald-500"
                  : "text-muted-foreground"
            }`}
          >
            {battery.brownoutCount}
          </p>
        </div>
        <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Last Perf.
          </p>
          <p className={`font-mono text-sm font-semibold ${perfColor(battery.lastPerformance)}`}>
            {battery.lastPerformance ? capitalize(battery.lastPerformance) : "—"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {battery.isInUse ? (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => setCheckInOpen(true)}
          >
            ✓ Log Result
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onCheckOut(battery.id, battery.name, null, null)}
          >
            ⚡ Quick Check Out
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (battery.isInUse) return;
            if (confirm(`Remove "${battery.name}"? Past log entries will be kept.`)) {
              onDelete(battery.id);
            }
          }}
          disabled={battery.isInUse}
        >
          ✕
        </Button>
      </div>

      {battery.isInUse && battery.activeSessionId && (
        <CheckInDialog
          sessionId={battery.activeSessionId}
          batteryName={battery.name}
          open={checkInOpen}
          onOpenChange={setCheckInOpen}
          onCheckIn={onCheckIn}
        />
      )}
    </div>
  );
}
