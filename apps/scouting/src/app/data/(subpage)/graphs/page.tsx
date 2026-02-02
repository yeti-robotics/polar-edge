"use client";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@repo/ui/components/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

function GraphData() {
  const data = [{ teamNumber: 254, auto: 12, teleop: 48, climb: 15 }];

  const data2 = [
    { match: 1, value: 60 },
    { match: 2, value: 55 },
    { match: 3, value: 65 },
    { match: 4, value: 58 },
    { match: 5, value: 62 },
  ];

  const data3 = [{ team: "254", cycles: 8.4 }];

  const data4 = [{ team: "254", success: 0.92 }];

  function ConsistencyChart() {
    return (
      <ChartContainer config={{ value: { label: "Points" } }} className="h-[300px]">
        <LineChart data={data2}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="match"
            label={{ value: "Match Number", position: "insideBottom", offset: -5 }}
          />
          <YAxis label={{ value: "Points", angle: -90, position: "insideLeft" }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="value" dot={false} stroke="#10b981" strokeWidth={3} />
        </LineChart>
      </ChartContainer>
    );
  }

  function CycleSpeedChart() {
    return (
      <ChartContainer config={{ cycles: { label: "Cycles / Match" } }} className="h-[300px]">
        <BarChart data={data3}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="team"
            label={{ value: "Team Number", position: "insideBottom", offset: -5 }}
          />
          <YAxis label={{ value: "Cycles per Match", angle: -90, position: "insideLeft" }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar fill="#ec4899" dataKey="cycles" />
        </BarChart>
      </ChartContainer>
    );
  }

  function ClimbSuccessChart() {
    return (
      <ChartContainer config={{ success: { label: "Climb Success" } }} className="h-[300px]">
        <BarChart data={data4}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="team"
            label={{ value: "Team Number", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            tickFormatter={(v) => `${v * 100}%`}
            label={{ value: "Success Rate", angle: -90, position: "insideLeft" }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar fill="#f97316" dataKey="success" />
        </BarChart>
      </ChartContainer>
    );
  }

  return (
    <div>
      <div className="container p-6">
        <h1 className="text-3xl font-bold mb-6">Team Performance Analytics</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Points Breakdown</h2>

            <ChartContainer
              config={{
                auto: { label: "Auto" },
                teleop: { label: "Teleop" },
                climb: { label: "Climb" },
              }}
              className="h-[300px]"
            >
              <BarChart data={data}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="teamNumber"
                  label={{ value: "Team Number", position: "insideBottom", offset: -5 }}
                />
                <YAxis label={{ value: "Points", angle: -90, position: "insideLeft" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar fill="#2563eb" dataKey="auto" stackId="a" />
                <Bar fill="#059669" dataKey="teleop" stackId="b" />
                <Bar fill="#dc2626" dataKey="climb" stackId="c" />
              </BarChart>
            </ChartContainer>
            <div className="flex gap-4 text-sm mb-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Avg. Auto</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span>Avg. Teleop</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span>Avg. Climb</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Consistency</h2>
            <ConsistencyChart />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Cycle Speed</h2>
            <CycleSpeedChart />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Climb Success</h2>
            <ClimbSuccessChart />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GraphData;
