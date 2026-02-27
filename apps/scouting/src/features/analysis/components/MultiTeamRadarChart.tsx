"use client";

import { Card } from "@repo/ui/components/card";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
} from "recharts";

export type MultiTeamRadarDataPoint = { subject: string } & Record<string, string | number>;

type Props = {
  data: MultiTeamRadarDataPoint[];
  teamNumbers: number[];
};

const TEAM_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7"] as const;

export function MultiTeamRadarChart({ data, teamNumbers }: Props) {
  return (
    <Card className="w-full p-6">
      <ResponsiveContainer minWidth={0} width="100%" height={360}>
        <RechartsRadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          {teamNumbers.map((num, i) => (
            <Radar
              key={num}
              name={`Team ${num}`}
              dataKey={String(num)}
              stroke={TEAM_COLORS[i % TEAM_COLORS.length]}
              fill={TEAM_COLORS[i % TEAM_COLORS.length]}
              fillOpacity={0.25}
              isAnimationActive={false}
            />
          ))}
          <Legend />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </Card>
  );
}
