import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { eq } from "drizzle-orm";
import { Badge } from "lucide-react";
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
        <Card className="w-full bg-black pb-32">
          <CardHeader>
            <CardTitle>Pit Scouting Data</CardTitle>
          </CardHeader>
          <CardContent>
            {!pitData ? (
              <p className="text-muted-foreground">
                No pit scouting data available
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drivetrain</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Climb Type</TableHead>
                    <TableHead>Capabilities</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{pitData.drivetrainType}</TableCell>
                    <TableCell>{pitData.weight} lbs</TableCell>
                    <TableCell>{pitData.capacity}</TableCell>
                    <TableCell>{pitData.climbType || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {pitData.canTrench && (
                          <p className="font-semibold">Trench </p>
                        )}

                        {pitData.canBump && (
                          <p className="font-semibold">Bump</p>
                        )}
                        {pitData.canShuttle && (
                          <p className="font-semibold"> Shuttle, </p>
                        )}
                        {!pitData.canTrench &&
                          !pitData.canBump && ( //added this logic in the case that none is preent so the useris not confused and knows clearly that there is no capbailotes of robot
                            <p> N/A </p>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
