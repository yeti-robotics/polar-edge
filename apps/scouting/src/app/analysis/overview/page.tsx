import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import Overview from "./Overview";
import { getAnalysisOverviewData } from "./actions";

function formatNumber(value: number): string {
  return value.toFixed(1);
}

export default async function AnalysisPage() {
  const requestHeaders = await headers();
  const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

  if (!activeMember) {
    redirect("/");
  }

  const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);

  if (!activeEvent?.event) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No active event set. Please configure an event in admin settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const overviewData = await getAnalysisOverviewData(activeEvent.event.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Analysis Overview</h1>
        <p className="text-muted-foreground mt-1">
          {activeEvent.event.name} ({activeEvent.event.eventCode})
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader>
            <CardDescription>Total teams</CardDescription>
            <CardTitle>{overviewData.summary.totalTeams}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Teams scouted</CardDescription>
            <CardTitle>{overviewData.summary.teamsScouted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total matches scouted</CardDescription>
            <CardTitle>{overviewData.summary.totalMatchesScouted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Avg points / match</CardDescription>
            <CardTitle>{formatNumber(overviewData.summary.avgPointsPerMatch)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Highest-scoring team</CardDescription>
            <CardTitle>
              {overviewData.summary.highestScoringTeam
                ? `${overviewData.summary.highestScoringTeam.teamNumber}`
                : "N/A"}
            </CardTitle>
            <CardDescription>
              {overviewData.summary.highestScoringTeam
                ? `${overviewData.summary.highestScoringTeam.teamName} (${formatNumber(overviewData.summary.highestScoringTeam.avgTotalPoints)})`
                : "No scouting data yet"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Overview teams={overviewData.teams} />
    </div>
  );
}
