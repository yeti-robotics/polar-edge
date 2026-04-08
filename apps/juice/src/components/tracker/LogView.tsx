import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import type { BatterySession } from "@/services/tracker/types";
import { exportSessionsCsv } from "@/services/tracker/csv";

interface LogViewProps {
  sessions: BatterySession[];
  onDelete: (id: string) => Promise<void>;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function perfBadge(p: string | null) {
  if (!p) return <span className="text-muted-foreground">—</span>;
  const variant =
    p === "excellent" || p === "good" ? "default" : p === "ok" ? "warning" : "destructive";
  return (
    <Badge variant={variant} className="text-[10px]">
      {p.charAt(0).toUpperCase() + p.slice(1)}
    </Badge>
  );
}

function brownoutBadge(b: boolean | null) {
  if (b === null) return <span className="text-muted-foreground">—</span>;
  return b ? (
    <Badge variant="destructive" className="text-[10px]">
      Yes
    </Badge>
  ) : (
    <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
      No
    </Badge>
  );
}

export function LogView({ sessions, onDelete }: LogViewProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-border py-16 text-center">
        <p className="mb-2 text-3xl opacity-30">📋</p>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          No sessions logged yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportSessionsCsv(sessions)}>
          ↓ Export CSV
        </Button>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Battery</TableHead>
              <TableHead>Date / Time</TableHead>
              <TableHead>KW700 (mΩ)</TableHead>
              <TableHead>Voltage</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Brownout?</TableHead>
              <TableHead>Brownout Time</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-semibold">{s.batteryName}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatDateTime(s.checkedOutAt)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {s.kw700MOhms !== null ? `${s.kw700MOhms}` : "—"}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {s.voltage !== null ? `${s.voltage} V` : "—"}
                </TableCell>
                <TableCell>{perfBadge(s.performance)}</TableCell>
                <TableCell>{brownoutBadge(s.hadBrownout)}</TableCell>
                <TableCell className="font-mono text-xs">{s.brownoutTiming || "—"}</TableCell>
                <TableCell className="max-w-44 truncate text-sm text-muted-foreground">
                  {s.notes || "—"}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this log entry?")) onDelete(s.id);
                    }}
                  >
                    ✕
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {sessions.map((s) => (
          <div key={s.id} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-start justify-between">
              <span className="text-base font-semibold">{s.batteryName}</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm("Delete this log entry?")) onDelete(s.id);
                }}
              >
                ✕
              </Button>
            </div>
            <p className="mb-2 font-mono text-[10px] text-muted-foreground">
              {formatDateTime(s.checkedOutAt)}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <MobileLogStat label="KW700" value={s.kw700MOhms !== null ? `${s.kw700MOhms} mΩ` : "—"} />
              <MobileLogStat label="Voltage" value={s.voltage !== null ? `${s.voltage} V` : "—"} />
              <div className="rounded-md bg-muted/50 px-2 py-1.5">
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Performance
                </p>
                <div className="mt-0.5">{perfBadge(s.performance)}</div>
              </div>
              <div className="rounded-md bg-muted/50 px-2 py-1.5">
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Brownout
                </p>
                <div className="mt-0.5">
                  {brownoutBadge(s.hadBrownout)}
                  {s.brownoutTiming && (
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      @ {s.brownoutTiming}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {s.notes && (
              <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                {s.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileLogStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-1.5">
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}
