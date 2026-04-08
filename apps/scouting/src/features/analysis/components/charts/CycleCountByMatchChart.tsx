"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CycleTimeseriesPoint } from "../../team-queries";

type ChartPoint = {
  index: number;
  auto: number;
  teleop: number;
  eventCode: string;
  matchNumber: number;
  matchType: string;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint; name: string; value: number; color: string }[];
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg text-popover-foreground">
      <p className="text-sm font-medium">
        {point.eventCode} &mdash; {point.matchType.toUpperCase()} {point.matchNumber}
      </p>
      <div className="mt-1.5 space-y-0.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="tabular-nums font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
        Total: {point.auto + point.teleop}
      </p>
    </div>
  );
}

export function CycleCountByMatchChart({ data }: { data: CycleTimeseriesPoint[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cycles by Match</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>No cycle data available</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  const chartData: ChartPoint[] = data.map((point, i) => ({
    index: i + 1,
    auto: point.autoCycleCount,
    teleop: point.teleopCycleCount,
    eventCode: point.eventCode,
    matchNumber: point.matchNumber,
    matchType: point.matchType,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Cycles by Match</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 20, left: -16 }}>
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
              tick={{ fontSize: 11, fill: "var(--foreground)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
            <Legend
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: 12 }}
              align="center"
              verticalAlign="bottom"
            />
            <Bar
              dataKey="auto"
              name="Auto"
              stackId="cycles"
              fill="var(--yeti-400)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="teleop"
              name="Teleop"
              stackId="cycles"
              fill="var(--yeti-700)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
