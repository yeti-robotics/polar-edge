// route for [teamNumber] page

import { Card } from "@repo/ui/components/card";
import { eq } from "drizzle-orm";
import { db } from "@/lib/database";
import { team as teamTable } from "@/lib/database/schema";

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

  const teamRow = teamResults[0];

  return (
    <div className="p-4">
      <Card className="w-full">
        <h1 className="text-4xl font-mono ml-2">
          Team {teamRow.teamNumber} Analysis
        </h1>
        <p className="mt-2 text-muted-foreground container text-md">
          Name: {teamRow.teamName}
        </p>
      </Card>
    </div>
  );
}
