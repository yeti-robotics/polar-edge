import { Card } from "@repo/ui/components/card";
import { eq } from "drizzle-orm";
import { db } from "@/lib/database";
import {
  pitForm,
  standForm,
  teamMatch,
  team as teamTable,
} from "@/lib/database/schema";
import { ScrollToBottomButton } from "../ScrollToBottom";
import { TeamRadarChart } from "../TeamRadarChart";
import { SelectTeam } from "./TeamSwitcher";

const allTeams = await db.select().from(teamTable);

export default async function TeamPage({
  params,
}: {
  params: { teamNumber: string };
}) {
  const { teamNumber } = await params;
  const teamResults = await db
    .select()
    .from(teamTable)
    .where(eq(teamTable.teamNumber, parseInt(teamNumber, 10)));
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

  const pitFormData = await db
    .select()
    .from(pitForm)
    .where(eq(pitForm.teamNumber, parseInt(teamNumber, 10)))
    .limit(1);

  const pitData = pitFormData[0];

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

  const radarData = [
    { subject: "Auto Scoring", value: 80 },
    { subject: "Teleop Scoring", value: 90 },
    { subject: "Climb Points", value: 75 },
    { subject: "Consistency", value: 80 },
    { subject: "Reliability", value: 70 },
  ];

  return (
    <div className="p-4 space-y-4">
      <Card className="w-full p-6 rounded-lg shadow-md">
        <h1 className="text-4xl font-mono">Team {teamRow.teamNumber}</h1>
        <p className="mt-2 text-muted-foreground">
          Team Name: {teamRow.teamName}
        </p>
        <SelectTeam teams={allTeams} />
        <ScrollToBottomButton />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TeamRadarChart data={radarData} />

        <Card className="w-full p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-mono mb-4">Metrics</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Auto:</span>
            </div>
            <div className="flex justify-between">
              <span>Teleop:</span>
            </div>
            <div className="flex justify-between">
              <span>Climb:</span>
            </div>
            <div className="flex justify-between">
              <span>Consistency:</span>
            </div>
            <div className="flex justify-between">
              <span>Reliability:</span>
            </div>
            <div className="flex justify-between">
              <span> Total matches Scouted: {totalMatches}</span>
            </div>
            <h1 className="font-bold text-3xl"> add backend </h1>
          </div>

          {/* Avg auto points
Avg teleop points
Avg climb points
Avg uptime % (reliability)
Avg downtime per match (oofTime in seconds)
Total matches scouted
Broke in X/Y matches (count where oofTime > 0)
 */}
        </Card>
        {/* fix the UI of this it looks horrid  */}
        <Card className="w-full p-20">
          <h2 className="text-2xl font-semibold mb-4"> Pit Scouting Data </h2>

          {/* put scouting data should go on here
          Show pit scouting data card (drivetrain, capacity, weight, climb type, trench/bump/shuttle capabilities)
  */}
          {!pitData ? (
            <p className="text-muted-foreground">
              No pit scouting data available
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Drivetrain</p>
                <p className="font-medium">{pitData.drivetrainType}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-medium">{pitData.weight} lbs</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="font-medium">{pitData.capacity}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Climb Type</p>
                <p className="font-medium">{pitData.climbType || "N/A"}</p>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Capabilities:</p>
                <div className="flex gap-2">
                  {pitData.canTrench && <span>Trench</span>}
                  {pitData.canBump && <span>Bump</span>}
                  {pitData.canShuttle && <span>Shuttle</span>}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
