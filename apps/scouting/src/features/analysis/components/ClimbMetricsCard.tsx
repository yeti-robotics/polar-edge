import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { TypographyLabel } from "@repo/ui/components/typography";
import type { TeamKeyMetrics } from "../team-queries";
import { MetricTile } from "./metric-tiles";

export function ClimbMetricsCard({
  metrics,
}: {
  metrics: Pick<TeamKeyMetrics, "avgClimbPoints" | "avgAutoClimbPoints" | "avgTeleopClimbPoints">;
}) {
  return (
    <Card>
      <CardHeader>
        <TypographyLabel className="font-medium">Climb Performance</TypographyLabel>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <MetricTile label="Avg Climb" value={metrics.avgClimbPoints} unit="pts" />
          <MetricTile label="Auto Climb" value={metrics.avgAutoClimbPoints} unit="pts" />
          <MetricTile label="Teleop Climb" value={metrics.avgTeleopClimbPoints} unit="pts" />
        </div>
      </CardContent>
    </Card>
  );
}
