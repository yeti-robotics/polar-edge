import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { TypographyMuted } from "@repo/ui/components/typography";
import type { AuditCycleRow } from "../types";

function CycleTable({ cycles, label }: { cycles: AuditCycleRow[]; label: string }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs uppercase tracking-widest font-mono text-muted-foreground mb-3">
        {label}
      </p>
      {cycles.length === 0 ? (
        <TypographyMuted className="text-sm">No cycles recorded.</TypographyMuted>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Duration (s)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cycles.map((c) => (
              <TableRow key={c.cycleNumber}>
                <TableCell className="tabular-nums">{c.cycleNumber}</TableCell>
                <TableCell className="tabular-nums">{c.dumpDuration.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function CyclesSection({ cycles }: { cycles: AuditCycleRow[] }) {
  const autoCycles = cycles.filter((c) => c.phase === "auto");
  const teleopCycles = cycles.filter((c) => c.phase === "teleop");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cycles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-8">
          <CycleTable cycles={autoCycles} label="Auto" />
          <div className="w-px bg-border" />
          <CycleTable cycles={teleopCycles} label="Teleop" />
        </div>
      </CardContent>
    </Card>
  );
}
