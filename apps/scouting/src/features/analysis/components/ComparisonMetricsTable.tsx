"use client";

import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import type { TeamKeyMetrics } from "../team-queries";

type Props = {
  teamNumbers: number[];
  teamNames: (string | null)[];
  metricsPerTeam: (TeamKeyMetrics | null)[];
};

type MetricRow = {
  label: string;
  unit?: string;
  getValue: (m: TeamKeyMetrics) => number;
  formatValue?: (v: number) => string;
  higherIsBetter: boolean;
  getValueClass?: (m: TeamKeyMetrics) => string | undefined;
};

const METRIC_ROWS: MetricRow[] = [
  {
    label: "Total Points",
    unit: "avg",
    getValue: (m) => Math.round((m.avgAutoPoints + m.avgTeleopPoints + m.avgClimbPoints) * 10) / 10,
    formatValue: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    label: "Avg Auto",
    unit: "fuel",
    getValue: (m) => m.avgAutoPoints,
    formatValue: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    label: "Avg Teleop",
    unit: "fuel",
    getValue: (m) => m.avgTeleopPoints,
    formatValue: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    label: "Avg Climb",
    unit: "pts",
    getValue: (m) => m.avgClimbPoints,
    formatValue: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    label: "Auto Climb",
    unit: "pts",
    getValue: (m) => m.avgAutoClimbPoints,
    formatValue: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    label: "Teleop Climb",
    unit: "pts",
    getValue: (m) => m.avgTeleopClimbPoints,
    formatValue: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    label: "Avg Uptime",
    unit: "%",
    getValue: (m) => m.avgUptimePct,
    formatValue: (v) => `${v}%`,
    higherIsBetter: true,
    getValueClass: (m) =>
      m.avgUptimePct >= 90
        ? "text-green-600 dark:text-green-400"
        : m.avgUptimePct >= 75
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400",
  },
  {
    label: "Avg Downtime",
    unit: "s",
    getValue: (m) => m.avgDowntimeSeconds,
    formatValue: (v) => `${v}s`,
    higherIsBetter: false,
    getValueClass: (m) =>
      m.avgDowntimeSeconds <= 5
        ? "text-green-600 dark:text-green-400"
        : m.avgDowntimeSeconds <= 20
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400",
  },
  {
    label: "Broke",
    getValue: (m) => m.brokeCount,
    formatValue: (v) => String(v),
    higherIsBetter: false,
    getValueClass: (m) => {
      const ratio = m.totalMatchesScouted > 0 ? m.brokeCount / m.totalMatchesScouted : 0;
      return ratio === 0
        ? "text-green-600 dark:text-green-400"
        : ratio < 0.3
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400";
    },
  },
  {
    label: "Matches Scouted",
    getValue: (m) => m.totalMatchesScouted,
    formatValue: (v) => String(v),
    higherIsBetter: true,
  },
];

function getWinnerIndex(row: MetricRow, metricsPerTeam: (TeamKeyMetrics | null)[]): number | null {
  const values = metricsPerTeam.map((m) => (m ? row.getValue(m) : null));
  const validValues = values.filter((v) => v !== null) as number[];
  if (validValues.length < 2) return null;

  const best = row.higherIsBetter ? Math.max(...validValues) : Math.min(...validValues);
  const count = validValues.filter((v) => v === best).length;
  if (count > 1) return null; // tie — no winner

  return values.indexOf(best);
}

export function ComparisonMetricsTable({ teamNumbers, teamNames, metricsPerTeam }: Props) {
  return (
    <Card className="w-full overflow-x-auto">
      <CardHeader className="pb-3 border-b border-border/50">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Key Metrics
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36 pl-6">Metric</TableHead>
              {teamNumbers.map((num, i) => (
                <TableHead key={num} className="min-w-28">
                  <span className="font-mono font-medium">{num}</span>
                  {teamNames[i] && (
                    <p className="text-xs text-muted-foreground font-normal truncate max-w-32">
                      {teamNames[i]}
                    </p>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {METRIC_ROWS.map((row, _rowIdx) => {
              const winnerIdx = getWinnerIndex(row, metricsPerTeam);
              const isTotal = row.label === "Total Points";
              return (
                <TableRow
                  key={row.label}
                  className={isTotal ? "bg-muted/30 border-b border-border" : undefined}
                >
                  <TableCell className="pl-6 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    {row.label}
                    {row.unit && (
                      <span className="ml-1 normal-case text-muted-foreground/50">{row.unit}</span>
                    )}
                  </TableCell>
                  {metricsPerTeam.map((metrics, i) => {
                    const isWinner = winnerIdx === i;
                    const rawValue = metrics ? row.getValue(metrics) : null;
                    const displayValue =
                      rawValue !== null
                        ? row.formatValue
                          ? row.formatValue(rawValue)
                          : String(rawValue)
                        : null;
                    const healthClass = metrics ? row.getValueClass?.(metrics) : undefined;

                    return (
                      <TableCell
                        key={teamNumbers[i]}
                        className={
                          isWinner
                            ? "text-green-600 dark:text-green-400"
                            : (healthClass ?? (metrics ? undefined : "text-muted-foreground"))
                        }
                      >
                        {metrics && displayValue !== null ? (
                          <span className="inline-flex items-center gap-1.5 font-normal tabular-nums">
                            {isWinner && (
                              <span className="text-green-600 dark:text-green-400 text-xs leading-none">
                                ▲
                              </span>
                            )}
                            {row.label === "Broke"
                              ? `${metrics.brokeCount} / ${metrics.totalMatchesScouted}`
                              : displayValue}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
