import { Card } from "@repo/ui/components/card";
import CompareTeamsButton from "./CompareTeamsButton";
import { db } from "@/lib/database";
import { climb, team } from "@/lib/database/schema";
import AnalysisRadarChart from "./CompareTeamsRadarChart";
import OverLayChart from "./OverLayChart";
import MetricsTable from "./MetricsTable";


async function getAllTeams() {
  return await db.select().from(team);
}

async function getTeamDataMetric() {
  return await db.select().from(climb).limit(20);
}

// for now i limited iti need to make 

export default async function CompareTeamsAnalysis({
  searchParams,
}: {
  searchParams: Promise<{ team1?: string; team2?: string }>;
}) {
  const teams = await getAllTeams();
  const params = await searchParams;

  const team1 = teams.find((t) => t.teamNumber === Number(params.team1));
  const team2 = teams.find((t) => t.teamNumber === Number(params.team2));

  const climbData = await getTeamDataMetric();
  
  return (
    <div className="p-8 space-y-4">
      <h1 className="font-mono text-3xl">Compare Teams Analysis</h1>
      
      <div className="flex gap-4">
        <CompareTeamsButton
          teams={teams}
          teamParam="team1"
          label="Team 1"
          variant="default"
        />
        <CompareTeamsButton
          teams={teams}
          teamParam="team2"
          label="Team 2"
          variant="outline"
        />
      </div>

      <Card className="p-6">
        {team1 && team2 ? (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-bold">{team1.teamName}</h2>
              <p className="text-muted-foreground text-lg">Team #{team1.teamNumber}</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{team2.teamName}</h2>
              <p className="text-muted-foreground text-lg">Team #{team2.teamNumber}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">Select both teams from the dropdowns to see comparison.</p>
        )}
      </Card>

      <Card className="p-6">
  {team1 && team2 ? (
    <div className="grid grid-cols-2 gap-6 text-center">
      
      <div className="flex flex-col items-center gap-2">
        <AnalysisRadarChart />
        <h3 className="text-lg font-semibold">{team1.teamName}</h3>
        <p className="text-sm text-muted-foreground">
          Team #{team1.teamNumber}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <AnalysisRadarChart />
        <h3 className="text-lg font-semibold">{team2.teamName}</h3>
        <p className="text-sm text-muted-foreground">
          Team #{team2.teamNumber}
        </p>
      </div>

    </div>
  ) : (
    <p className="text-gray-400">
      Select both teams to view radar charts.
    </p>
  )}
</Card>

{/* this is for the overly for both teams
<div className="flex items-center justify-center min-h-screen"> 
  <Card>
    <OverLayChart/>
  </Card>
</div> */}
<div>
  <Card>
    <MetricsTable climbs={climbData} />
  </Card>
</div>
    </div>
  );
}

// rtight now the radar chrt is hard coded from values from open srouce use the db to sync it later