"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Alliance = "red" | "blue";

export interface LineGraphDataPoint {
  matchNumber: number;
  alliance: Alliance;
  totalPoints: number;
  autoPoints: number;
  teleopPoints: number;
  climbPoints: number;
}

export interface LineGraphProps {
  data: LineGraphDataPoint[];
}

const ALLIANCE_COLORS: Record<Alliance, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
};

function TotalPointsScoredTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: LineGraphDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as LineGraphDataPoint | undefined;
  if (!row) return null;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
      <div className="font-medium">Match {row.matchNumber}</div>
      <div>Total points: {row.totalPoints.toFixed(1)}</div>
      <div className="mt-1 flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: ALLIANCE_COLORS[row.alliance] }}
        />
        <span>Alliance: {row.alliance}</span>
      </div>
    </div>
  );
}

function BreakdownTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: LineGraphDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as LineGraphDataPoint | undefined;
  if (!row) return null;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
      <div className="font-medium">Match {row.matchNumber}</div>
      <div>Auto: {row.autoPoints.toFixed(1)}</div>
      <div>Teleop: {row.teleopPoints.toFixed(1)}</div>
      <div>Climb: {row.climbPoints.toFixed(1)}</div>
    </div>
  );
}

export default function LineGraphPerformanceCharts({ data }: LineGraphProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">No match data</div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Total points per match</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalPointsStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="matchNumber" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={44} />
                <Tooltip content={<TotalPointsScoredTooltip />} />
                <Line
                  type="monotone"
                  dataKey="totalPoints"
                  stroke="url(#totalPointsStroke)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#0ea5e9" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Points breakdown per match</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="matchNumber" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={44} />
                <Tooltip content={<BreakdownTooltip />} />
                <Legend />
                <Bar dataKey="autoPoints" stackId="points" fill="#3b82f6" name="Auto points" />
                <Bar dataKey="teleopPoints" stackId="points" fill="#22c55e" name="Teleop points" />
                <Bar dataKey="climbPoints" stackId="points" fill="#f97316" name="Climb points" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
