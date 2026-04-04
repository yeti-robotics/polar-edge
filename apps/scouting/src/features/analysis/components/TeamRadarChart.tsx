"use client";
import { Card } from "@repo/ui/components/card";
import type { TypedDataKey } from "recharts/types/util/typedDataKey";
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

type StringKeyOf<T> = Extract<
  {
    [K in keyof T]: T[K] extends string ? K : never;
  }[keyof T],
  string
>;

type NumberKeyOf<T> = Extract<
  {
    [K in keyof T]: T[K] extends number ? K : never;
  }[keyof T],
  string
>;

export type RadarChartProps<T extends RadarChartDataPoint> = {
  data: T[];
  /** Key for axis labels (default: "subject") */
  angleKey?: StringKeyOf<T>;
  /** Key for values (default: "value") */
  valueKey?: NumberKeyOf<T>;
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
  angleKey = "subject" as StringKeyOf<T>,
  valueKey = "value" as NumberKeyOf<T>,
  name = "Score",
  domain = [0, 100],
  color = "#8884d8",
  fillOpacity = 0.6,
  showLegend = true,
  animation = false,
}: RadarChartProps<T>) => {
  const typedAngleKey = angleKey as TypedDataKey<T, string>;
  const typedValueKey = valueKey as TypedDataKey<T, number>;

  return (
    <Card className="w-full p-6 rounded-lg shadow-md">
      <div className="w-full">
        <ResponsiveContainer minWidth={0} width="100%" height={360}>
          <RechartsRadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={typedAngleKey} />
            <PolarRadiusAxis angle={90} domain={domain} />
            <Radar
              name={name}
              dataKey={typedValueKey}
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
