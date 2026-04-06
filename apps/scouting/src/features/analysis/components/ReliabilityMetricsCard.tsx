import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { TypographyLabel } from "@repo/ui/components/typography";
import type { TeamKeyMetrics } from "../team-queries";
import { MetricTile } from "./metric-tiles";

export function ReliabilityMetricsCard({ metrics }: { metrics: TeamKeyMetrics }) {
  const uptimeClass =
    metrics.avgUptimePct >= 90
      ? "text-green-600 dark:text-green-400"
      : metrics.avgUptimePct >= 75
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const downtimeClass =
    metrics.avgDowntimeSeconds <= 5
      ? "text-green-600 dark:text-green-400"
      : metrics.avgDowntimeSeconds <= 20
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const brokeRatio = metrics.brokeCount / metrics.totalMatchesScouted;
  const brokeClass =
    brokeRatio === 0
      ? "text-green-600 dark:text-green-400"
      : brokeRatio < 0.3
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <Card>
      <CardHeader>
        <TypographyLabel className="font-medium">Reliability</TypographyLabel>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <MetricTile
            label="Avg Uptime"
            value={`${metrics.avgUptimePct}%`}
            valueClass={uptimeClass}
          />
          <MetricTile
            label="Avg Downtime"
            value={metrics.avgDowntimeSeconds}
            unit="s / match"
            valueClass={downtimeClass}
          />
          <MetricTile
            label="Broke"
            value={`${metrics.brokeCount} / ${metrics.totalMatchesScouted}`}
            unit="matches"
            valueClass={brokeClass}
          />
        </div>
      </CardContent>
    </Card>
  );
}
