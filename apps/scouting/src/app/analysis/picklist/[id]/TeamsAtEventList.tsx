import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { getTeamMetricsForEvent, getTeamsForEvent } from "../queries";
import { TeamsAtEventClient } from "./TeamsAtEventClient";

interface TeamsAtEventListProps {
  eventId: string;
  picklistId: string;
  picklistTeams: number[];
  picklists: { id: string; name: string }[];
}

export async function TeamsAtEventList({
  eventId,
  picklistId,
  picklistTeams,
  picklists,
}: TeamsAtEventListProps) {
  const [allTeams, metricsMap] = await Promise.all([
    getTeamsForEvent(eventId),
    getTeamMetricsForEvent(eventId),
  ]);

  const nextRank = picklistTeams.length + 1;

  // Attach metrics to teams
  const teamsWithMetrics = allTeams.map((team) => {
    const metrics = metricsMap.get(team.teamNumber);
    return {
      teamNumber: team.teamNumber,
      teamName: team.teamName,
      avgTotalPoints: metrics?.avgTotalPoints,
      climbSuccessPct: metrics?.climbSuccessPct,
      uptimePct: metrics?.uptimePct,
      matchesScouted: metrics?.matchesScouted,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Teams at Event</CardTitle>
      </CardHeader>
      <CardContent>
        <TeamsAtEventClient
          teams={teamsWithMetrics}
          picklists={picklists}
          currentPicklistId={picklistId}
          picklistTeams={picklistTeams}
          nextRank={nextRank}
        />
      </CardContent>
    </Card>
  );
}
