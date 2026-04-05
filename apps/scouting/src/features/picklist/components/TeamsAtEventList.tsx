import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { getWorkabilitySummaryForEvent } from "@/features/scouting/workability/queries";
import {
  getCompatibilityMetricsForTeam,
  getTeamMetricsForEvent,
  getTeamsForEvent,
} from "../queries";
import { CompatibilitySection } from "./CompatibilitySection";
import { TeamsAtEventClient } from "./TeamsAtEventClient";

interface TeamsAtEventListProps {
  eventId: string;
  picklistId: string;
  picklistTeams: number[];
  organizationId: string;
}

export async function TeamsAtEventList({
  eventId,
  picklistId,
  picklistTeams,
  organizationId,
}: TeamsAtEventListProps) {
  const [allTeams, metricsMap, workabilitySummary] = await Promise.all([
    getTeamsForEvent(eventId),
    getTeamMetricsForEvent(eventId),
    getWorkabilitySummaryForEvent(eventId, organizationId),
  ]);

  const nextRank = picklistTeams.length + 1;

  // Attach metrics to teams
  const teamsWithMetrics = allTeams.map((team) => {
    const metrics = metricsMap.get(team.teamNumber);
    const compatibility = getCompatibilityMetricsForTeam(workabilitySummary, team.teamNumber);

    return {
      teamNumber: team.teamNumber,
      teamName: team.teamName,
      avgTotalPoints: metrics?.avgTotalPoints,
      climbSuccessPct: metrics?.climbSuccessPct,
      uptimePct: metrics?.uptimePct,
      matchesScouted: metrics?.matchesScouted,
      ...compatibility,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Teams</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[calc(100vh-16rem)] space-y-4 overflow-y-auto">
        <CompatibilitySection teams={teamsWithMetrics} />
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">All Teams at Event</h3>
            <p className="text-sm text-muted-foreground">
              Compare compatibility feedback with output metrics and add teams directly into the
              picklist.
            </p>
          </div>
          <TeamsAtEventClient
            teams={teamsWithMetrics}
            currentPicklistId={picklistId}
            picklistTeams={picklistTeams}
            nextRank={nextRank}
          />
        </div>
      </CardContent>
    </Card>
  );
}
