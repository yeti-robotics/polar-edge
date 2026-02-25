import { Card } from "@repo/ui/components/card";
import CompareTeamsButton from "./CompareTeamsButton";
import { db } from "@/lib/database";
import { team } from "@/lib/database/schema";

async function getAllTeams() {
  return await db.select().from(team);
}

export default async function CompareTeamsAnalysis({
  searchParams,
}: {
  searchParams: Promise<{ team1?: string; team2?: string }>;
}) {
  const teams = await getAllTeams();
  const params = await searchParams;

  const selectedTeam = teams.find(
    (t) => t.teamNumber === Number(params.team1)
  );

  return (
    <div className="p-8 space-y-4">
      <h1 className="font-bold text-3xl">Compare Teams Analysis</h1>
      
      <CompareTeamsButton teams={teams} />

      <Card className="p-6">
        {selectedTeam ? (
          <div>
            <h2 className="text-2xl font-bold">{selectedTeam.teamName}</h2>
            <p className="text-muted-foreground text-lg">Team #{selectedTeam.teamNumber}</p>
          </div>
        ) : (
          <p className="text-gray-400">Select a team from the dropdown to see details.</p>
        )}
      </Card>
    </div>
  );
}