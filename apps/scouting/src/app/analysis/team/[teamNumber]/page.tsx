// route for [teamNumber] page

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/database";
import {
  climb,
  cycle,
  standForm,
  teamMatch,
  team as teamTable,
} from "@/lib/database/schema";
import { TeamRadarChart } from "../Recharts";

export default async function TeamPage({
  params,
}: {
  params: { teamNumber: string };
}) {
  const { teamNumber } = await params;
  const teamResults = await db
    .select()
    .from(teamTable)
    .where(eq(teamTable.teamNumber, parseInt(teamNumber, 10)))
    .limit(1);

  if (!teamResults || teamResults.length === 0)
    return (
      <Card className="w-full p-6 rounded-lg shadow-md">
        <div className="p-4">
          <h1 className="text-4xl font-mono">Team {teamNumber} Not Found</h1>
        </div>
      </Card>
    );

  const teamRow = teamResults[0] as NonNullable<(typeof teamResults)[0]>;

  const standForms = await db
    .select({
      id: standForm.id,
      oofTimeSeconds: standForm.oofTimeSeconds,
      teamMatchId: standForm.teamMatchId,
    })
    .from(standForm)
    .innerJoin(teamMatch, eq(standForm.teamMatchId, teamMatch.id))
    .where(eq(teamMatch.teamNumber, parseInt(teamNumber, 10)))
    .limit(1);

  if (!standForms || standForms.length === 0) {
    return (
      <Card className="w-full p-6 rounded-lg shadow-md">
        <h1 className="text-4xl font-mono">
          No Stand Form Data for Team {teamNumber}
        </h1>
      </Card>
    );
  }

  const totalMatches = standForms.length;

  const reliabilitySum = standForms.reduce((sum, form) => {
    const uptime = 150 - form.oofTimeSeconds;
    return sum + (uptime / 150) * 100;
  }, 0);

  const reliability = reliabilitySum / totalMatches;

  const standFormsId = standForms.map((form) => form.id);

  const cycles = await db
    .select({
      phase: cycle.phase,
      bucket: cycle.bucket,
      standformId: cycle.standFormId,
    })
    .from(cycle)
    .where(sql`${cycle.standFormId} IN ${standFormsId}`);

  const radarData = [
    { subject: "Auto Scoring", value: 85, fullmark: 100 },
    { subject: "Teleop Scoring", value: 90, fullmark: 100 },
    { subject: "Climb Points", value: 75, fullmark: 100 },
    { subject: "Consistency", value: 80, fullmark: 100 },
    { subject: "Reliability", value: 70, fullmark: 100 },
  ];

  return (
    <div className="p-4 space-y-4">
      <Card className="w-full p-6 rounded-lg shadow-md">
        <h1 className="text-4xl font-mono">
          Team {teamRow.teamNumber} Analysis
        </h1>
        <p className="mt-2 text-muted-foreground">Name: {teamRow.teamName}</p>
        <Button className="w-30">Switch Team</Button>
        <Label>
          {" "}
          This should use autocomplete and change to view all the teams and
          compare data and such for scouts and strat leads/ us to view{" "}
        </Label>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TeamRadarChart data={radarData} />

        <Card className="w-full p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-mono mb-4">Metrics</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Auto:</span>
              <span className="font-bold">{radarData[0].value}/100</span>
            </div>
            <div className="flex justify-between">
              <span>Teleop:</span>
              <span className="font-bold">{radarData[1].value}/100</span>
            </div>
            <div className="flex justify-between">
              <span>Climb:</span>
              <span className="font-bold">{radarData[2].value}/100</span>
            </div>
            <div className="flex justify-between">
              <span>Consistency:</span>
              <span className="font-bold">{radarData[3].value}/100</span>
            </div>
            <div className="flex justify-between">
              <span>Reliability:</span>
              <span className="font-bold">{radarData[4].value}/100</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
