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

export type RadarChartDataPoint = Record<string, string | number>;

export type RadarChartProps<T extends RadarChartDataPoint> = {
  data: T[];
  /** Key for axis labels (default: "subject") */
  angleKey?: keyof T & string;
  /** Key for values (default: "value") */
  valueKey?: keyof T & string;
  /** Series label in legend (default: "Score") */
  name?: string;
  /** Min and max for radius axis (default: [0, 100]) */
  domain?: [number, number];
  /** Stroke and fill color (default: "#8884d8") */
  color?: string;
  /** Fill opacity (default: 0.6) */
  fillOpacity?: number;
  /** Show legend (default: true) */
  showLegend?: boolean;
  /** Animation enabled (default: true) */
  animation?: boolean;
};

export const RadarChart = <T extends RadarChartDataPoint>({
  data,
  angleKey = "subject" as keyof T & string,
  valueKey = "value" as keyof T & string,
  name = "Score",
  domain = [0, 100],
  color = "#8884d8",
  fillOpacity = 0.6,
  showLegend = true,
  animation = false,
}: RadarChartProps<T>) => {
  return (
    <Card className="w-full p-6 rounded-lg shadow-md">
      <div className="w-full">
        <ResponsiveContainer minWidth={0} width="100%" height={360}>
          <RechartsRadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={angleKey} />
            <PolarRadiusAxis angle={90} domain={domain} />
            <Radar
              name={name}
              dataKey={valueKey}
              stroke={color}
              fill={color}
              fillOpacity={fillOpacity}
              isAnimationActive={animation}
            />
            {showLegend && <Legend />}
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
