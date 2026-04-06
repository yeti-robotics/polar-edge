import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { TypographyLabel, TypographyMuted } from "@repo/ui/components/typography";
import type { BpsEstimate, CycleTimeseriesPoint, TeamKeyMetrics } from "../team-queries";
import { CycleCountByMatchChart } from "./charts/CycleCountByMatchChart";
import { MedianShootingTimeChart } from "./charts/MedianShootingTimeChart";
import { ShootingTimeByMatchChart } from "./charts/ShootingTimeByMatchChart";
import { MetricTile } from "./metric-tiles";

export function FuelMetricsSection({
  metrics,
  bps,
  timeseries,
}: {
  metrics: TeamKeyMetrics;
  bps: BpsEstimate | null;
  timeseries: CycleTimeseriesPoint[];
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <TypographyLabel className="font-medium">Fuel Performance</TypographyLabel>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            <MetricTile label="Avg Auto" value={metrics.avgAutoPoints} unit="fuel" />
            <MetricTile label="Avg Teleop" value={metrics.avgTeleopPoints} unit="fuel" />
            <MetricTile
              label="Est. BPS"
              value={bps ? bps.bps : "N/A"}
              unit={bps ? "balls/s" : undefined}
              description={
                bps
                  ? `${bps.totalFuelPerMatch} fuel / ${bps.avgShootingTimePerMatch}s per match`
                  : "Insufficient data"
              }
            />
            <MetricTile label="Matches Scouted" value={metrics.totalMatchesScouted} />
          </div>
        </CardContent>
      </Card>

      {timeseries.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <MedianShootingTimeChart data={timeseries} />
          <CycleCountByMatchChart data={timeseries} />
          <ShootingTimeByMatchChart data={timeseries} />
        </div>
      ) : (
        <Card>
          <CardContent className="py-6">
            <TypographyMuted>No cycle timeseries data available</TypographyMuted>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
