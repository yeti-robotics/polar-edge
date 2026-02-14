"use client";
import { Card } from "@repo/ui/components/card";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

export const TeamRadarChart = ({
  data,
}: {
  data: Array<{ subject: string; value: number; fullmark: number }>; //used claude to help change the recharts into what we actually want from the github issue
}) => (
  <Card className="w-full p-6 rounded-lg shadow-md">
    <RadarChart
      style={{
        width: "100%",
        maxWidth: "500px",
        maxHeight: "70vh",
        aspectRatio: 1,
      }}
      responsive
      data={data}
    >
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
  </Card>
);
export default TeamRadarChart;
