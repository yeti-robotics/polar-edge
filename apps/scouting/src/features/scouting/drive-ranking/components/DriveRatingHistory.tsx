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
import type { DriveRatingHistoryPoint } from "../types";

function RankBadge({ rank }: { rank: number }) {
  const colors =
    rank === 1
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : rank === 2
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

  const label = rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}
    >
      {label}
    </span>
  );
}

type ChartPoint = DriveRatingHistoryPoint & {
  index: number;
};

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
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-lg tabular-nums font-bold">{point.ordinal.toFixed(1)}</span>
        <RankBadge rank={point.rank} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        &mu; {point.mu.toFixed(1)} &middot; &sigma; {point.sigma.toFixed(2)}
      </p>
    </div>
  );
}

export function DriveRatingHistoryChart({ history }: { history: DriveRatingHistoryPoint[] }) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drive Rating History</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>No ranking history available</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  const data: ChartPoint[] = history.map((point, i) => ({
    ...point,
    index: i + 1,
  }));

  const ordinals = data.map((d) => d.ordinal);
  const padding = Math.max(2, (Math.max(...ordinals) - Math.min(...ordinals)) * 0.1);
  const minY = Math.floor(Math.min(...ordinals) - padding);
  const maxY = Math.ceil(Math.max(...ordinals) + padding);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drive Rating History</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
            <defs>
              <linearGradient id="driveRatingGradient" x1="0" y1="0" x2="0" y2="1">
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
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="ordinal"
              stroke="var(--yeti-500)"
              strokeWidth={2}
              fill="url(#driveRatingGradient)"
              dot={{ r: 4, fill: "var(--yeti-500)", strokeWidth: 0 }}
              activeDot={{
                r: 6,
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
