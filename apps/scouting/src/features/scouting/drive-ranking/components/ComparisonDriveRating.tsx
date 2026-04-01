"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DriveRatingHistoryPoint, DriveTeamRating } from "../types";

const TEAM_COLORS = ["var(--yeti-500)", "#f97316", "#22c55e", "#a855f7", "#ec4899"];

type Props = {
  teamNumbers: number[];
  teamNames: (string | null)[];
  ratingsPerTeam: (DriveTeamRating | null)[];
  historyPerTeam: DriveRatingHistoryPoint[][];
};

type ChartPoint = {
  index: number;
  [teamKey: string]: number;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg text-popover-foreground">
      <p className="text-xs text-muted-foreground mb-1">Observation {label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="font-medium">Team {entry.dataKey}</span>
          <span className="tabular-nums ml-auto">{entry.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export function ComparisonDriveRating({
  teamNumbers,
  teamNames,
  ratingsPerTeam,
  historyPerTeam,
}: Props) {
  const hasAnyData = ratingsPerTeam.some((r) => r !== null);

  if (!hasAnyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drive Team Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>No drive team ranking data available</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  // Build overlaid history chart data
  // Find the max history length across teams
  const maxLen = Math.max(...historyPerTeam.map((h) => h.length));

  const chartData: ChartPoint[] = [];
  for (let i = 0; i < maxLen; i++) {
    const point: ChartPoint = { index: i + 1 };
    for (let t = 0; t < teamNumbers.length; t++) {
      const h = historyPerTeam[t]?.[i];
      if (h) {
        point[String(teamNumbers[t])] = Math.round(h.ordinal * 10) / 10;
      }
    }
    chartData.push(point);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drive Team Skill</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {teamNumbers.map((num, i) => {
            const rating = ratingsPerTeam[i];
            const name = teamNames[i];
            return (
              <div key={num} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: TEAM_COLORS[i % TEAM_COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground truncate">
                    {num}
                    {name ? ` — ${name}` : ""}
                  </span>
                </div>
                <p className="text-2xl font-bold tabular-nums leading-none">
                  {rating ? rating.ordinal.toFixed(1) : "—"}
                </p>
                {rating && (
                  <p className="text-xs text-muted-foreground">{rating.matchesRanked} ranked</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Overlaid history chart */}
        {maxLen > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
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
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string) => (
                  <span className="text-xs text-muted-foreground">Team {value}</span>
                )}
              />
              {teamNumbers.map((num, i) => (
                <Area
                  key={num}
                  type="monotone"
                  dataKey={String(num)}
                  stroke={TEAM_COLORS[i % TEAM_COLORS.length]}
                  strokeWidth={2}
                  fill={TEAM_COLORS[i % TEAM_COLORS.length]}
                  fillOpacity={0.05}
                  dot={{ r: 3, strokeWidth: 0, fill: TEAM_COLORS[i % TEAM_COLORS.length] }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
