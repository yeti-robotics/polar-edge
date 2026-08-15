import { Button } from "@repo/ui/components/button";
import { useState } from "react";
import type { BatterySession, DashboardStats, SessionPerformance } from "@/services/tracker/types";
import { CheckInDialog } from "./CheckInDialog";

interface DashboardViewProps {
  stats: DashboardStats;
  activeSessions: BatterySession[];
  onCheckIn: (
    sessionId: string,
    performance: SessionPerformance,
    hadBrownout: boolean,
    brownoutTiming: string | null,
    notes: string
  ) => Promise<void>;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function DashboardView({ stats, activeSessions, onCheckIn }: DashboardViewProps) {
  const [checkInSession, setCheckInSession] = useState<BatterySession | null>(null);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Total Batteries" value={stats.total} color="text-primary" />
        <StatBox label="Available" value={stats.available} color="text-emerald-500" />
        <StatBox label="In Use" value={stats.inUse} color="text-blue-500" />
        <StatBox label="Total Brownouts" value={stats.brownouts} color="text-red-500" />
      </div>

      {/* Currently In Use */}
      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-4 py-2.5">
          <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Currently In Use
          </h3>
        </div>
        {activeSessions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-1 text-2xl opacity-30">🔋</p>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              No batteries currently in use
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeSessions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <span className="min-w-24 text-lg font-semibold">{s.batteryName}</span>
                <div className="flex flex-1 flex-wrap gap-4">
                  <MiniStat label="KW700" value={s.kw700MOhms ? `${s.kw700MOhms} mΩ` : "—"} />
                  <MiniStat label="Voltage" value={s.voltage ? `${s.voltage} V` : "—"} />
                  <MiniStat label="Checked Out" value={formatTime(s.checkedOutAt)} />
                </div>
                <Button size="sm" variant="outline" onClick={() => setCheckInSession(s)}>
                  ✓ Log Result
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {checkInSession && (
        <CheckInDialog
          sessionId={checkInSession.id}
          batteryName={checkInSession.batteryName}
          open={!!checkInSession}
          onOpenChange={(open) => !open && setCheckInSession(null)}
          onCheckIn={onCheckIn}
        />
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className={`font-mono text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-mono text-sm">{value}</p>
    </div>
  );
}
