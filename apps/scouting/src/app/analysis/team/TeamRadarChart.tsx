"use client";
import { Card } from "@repo/ui/components/card";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export const TeamRadarChart = ({
  data,
}: {
  data: Array<{ subject: string; value: number }>; //used claude to help change the recharts into what we actually want from the github issue
}) => (
  <Card className="w-full p-6 rounded-lg shadow-md">
    <div className="w-full h-90">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Team Performance"
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
            isAnimationActive={true}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  </Card>
);
export default TeamRadarChart;
