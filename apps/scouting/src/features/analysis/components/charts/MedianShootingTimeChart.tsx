"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CycleTimeseriesPoint } from "../../team-queries";

type ChartPoint = CycleTimeseriesPoint & { index: number };

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg text-popover-foreground">
      <p className="text-sm font-medium">
        {point.eventCode} &mdash; {point.matchType.toUpperCase()} {point.matchNumber}
      </p>
      <p className="mt-1 text-lg tabular-nums font-bold">{point.medianDumpDuration}s</p>
      <p className="text-xs text-muted-foreground">Median shooting time per cycle</p>
    </div>
  );
}

export function MedianShootingTimeChart({ data }: { data: CycleTimeseriesPoint[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Median Shooting Time per Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>No cycle data available</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  const chartData: ChartPoint[] = data.map((point, i) => ({ ...point, index: i + 1 }));

  const durations = chartData.map((d) => d.medianDumpDuration);
  const padding = Math.max(0.5, (Math.max(...durations) - Math.min(...durations)) * 0.15);
  const minY = Math.max(0, Math.floor((Math.min(...durations) - padding) * 10) / 10);
  const maxY = Math.ceil((Math.max(...durations) + padding) * 10) / 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Median Shooting Time per Cycle</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 20, left: -16 }}>
            <defs>
              <linearGradient id="medianShootingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--yeti-500)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--yeti-500)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="index"
              tick={{ fontSize: 11, fill: "var(--foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minY, maxY]}
              tick={{ fontSize: 11, fill: "var(--foreground)" }}
              tickLine={false}
              axisLine={false}
              unit="s"
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="medianDumpDuration"
              stroke="var(--yeti-500)"
              strokeWidth={2}
              fill="url(#medianShootingGradient)"
              dot={{ r: 3, fill: "var(--yeti-500)", strokeWidth: 0 }}
              activeDot={{
                r: 5,
                fill: "var(--yeti-500)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
