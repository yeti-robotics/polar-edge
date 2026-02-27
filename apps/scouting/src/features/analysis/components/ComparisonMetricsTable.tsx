"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
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
  getValue: (m: TeamKeyMetrics) => string | number;
  getValueClass?: (m: TeamKeyMetrics) => string | undefined;
};

const METRIC_ROWS: MetricRow[] = [
  {
    label: "Avg Auto",
    unit: "fuel",
    getValue: (m) => m.avgAutoPoints,
  },
  {
    label: "Avg Teleop",
    unit: "fuel",
    getValue: (m) => m.avgTeleopPoints,
  },
  {
    label: "Avg Climb",
    unit: "pts",
    getValue: (m) => m.avgClimbPoints,
  },
  {
    label: "Auto Climb",
    unit: "pts",
    getValue: (m) => m.avgAutoClimbPoints,
  },
  {
    label: "Teleop Climb",
    unit: "pts",
    getValue: (m) => m.avgTeleopClimbPoints,
  },
  {
    label: "Avg Uptime",
    unit: "%",
    getValue: (m) => `${m.avgUptimePct}%`,
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
    getValue: (m) => `${m.avgDowntimeSeconds}s`,
    getValueClass: (m) =>
      m.avgDowntimeSeconds <= 5
        ? "text-green-600 dark:text-green-400"
        : m.avgDowntimeSeconds <= 20
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400",
  },
  {
    label: "Broke",
    getValue: (m) => `${m.brokeCount} / ${m.totalMatchesScouted}`,
    getValueClass: (m) => {
      const ratio = m.brokeCount / m.totalMatchesScouted;
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
  },
];

export function ComparisonMetricsTable({ teamNumbers, teamNames, metricsPerTeam }: Props) {
  return (
    <Card className="w-full overflow-x-auto">
      <CardHeader>
        <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-medium">
          Performance Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36 pl-6">Metric</TableHead>
              {teamNumbers.map((num, i) => (
                <TableHead key={num} className="min-w-28">
                  <span className="font-mono font-semibold">{num}</span>
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
            {METRIC_ROWS.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="pl-6 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  {row.label}
                </TableCell>
                {metricsPerTeam.map((metrics, i) => (
                  <TableCell
                    key={teamNumbers[i]}
                    className={metrics ? row.getValueClass?.(metrics) : "text-muted-foreground"}
                  >
                    {metrics ? (
                      <span className="font-medium tabular-nums">{row.getValue(metrics)}</span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
