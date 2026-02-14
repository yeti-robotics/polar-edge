import { Card, CardContent } from "@repo/ui/components/card";
import type { LineGraphProps } from "./LineGraphData";
import LineGraphPerformanceCharts from "./LineGraphData";

async function getGraphData(): Promise<LineGraphProps["data"]> {
  return [
    {
      matchNumber: 1,
      alliance: "red",
      totalPoints: 56,
      autoPoints: 12,
      teleopPoints: 28,
      climbPoints: 16,
    },
    {
      matchNumber: 2,
      alliance: "blue",
      totalPoints: 52,
      autoPoints: 10,
      teleopPoints: 27,
      climbPoints: 15,
    },
    {
      matchNumber: 3,
      alliance: "red",
      totalPoints: 61,
      autoPoints: 14,
      teleopPoints: 30,
      climbPoints: 17,
    },
    {
      matchNumber: 4,
      alliance: "blue",
      totalPoints: 49,
      autoPoints: 9,
      teleopPoints: 25,
      climbPoints: 15,
    },
    {
      matchNumber: 5,
      alliance: "red",
      totalPoints: 64,
      autoPoints: 15,
      teleopPoints: 31,
      climbPoints: 18,
    },
    {
      matchNumber: 6,
      alliance: "blue",
      totalPoints: 58,
      autoPoints: 11,
      teleopPoints: 29,
      climbPoints: 18,
    },
  ];
}

export default async function GraphDataPage() {
  const data = await getGraphData();
  const dataSorted = [...data].sort((a, b) => a.matchNumber - b.matchNumber);
  return (
    <div>
      <div className="container">
        <Card>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl">Team Performance Charts</h1>
                <p className="mt-1 text-muted-foreground">(mock data for now).</p>
              </div>
              <LineGraphPerformanceCharts data={dataSorted} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
