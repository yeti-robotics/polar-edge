import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MatchHistoryTable } from "@/app/data/(subpage)/teams/[team]/MatchHistoryTable";
import { OrganizationFilterToggle } from "@/components/teams/OrganizationFilterToggle";
import { auth } from "@/lib/auth";
import { getTeamInfo, getTeamMatchDetails, getTeamMatchHistory } from "./actions";

interface TeamPageProps {
  params: Promise<{ team: string }>;
  searchParams: Promise<{ filterByOrg?: string }>;
}

async function getActiveOrganizationId(): Promise<string | null> {
  const requestHeaders = await headers();
  const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });
  return activeMember?.organizationId ?? null;
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { team } = await params;
  const { filterByOrg } = await searchParams;
  const teamNumber = parseInt(team, 10);

  if (Number.isNaN(teamNumber)) {
    notFound();
  }

  const organizationId = await getActiveOrganizationId();
  const filterByOrgBool = filterByOrg === "true";

  const [teamInfo, matchHistory] = await Promise.all([
    getTeamInfo(teamNumber),
    getTeamMatchHistory(teamNumber, organizationId, filterByOrgBool),
  ]);

  if (!teamInfo) {
    notFound();
  }

  // Fetch match details for all matches in parallel
  const matchDetailsPromises = matchHistory.map((match) =>
    getTeamMatchDetails(match.teamMatchId, organizationId, filterByOrgBool).then(
      (details) => [match.teamMatchId, details] as const
    )
  );

  const matchDetailsArray = await Promise.all(matchDetailsPromises);
  const matchDetails = new Map(matchDetailsArray);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">{teamInfo.teamName}</h1>
          <p className="text-muted-foreground mt-1">Team {teamInfo.teamNumber}</p>
        </div>
        <Suspense fallback={<div className="h-5 w-40" />}>
          <OrganizationFilterToggle />
        </Suspense>
      </div>

      <div>
        <h2 className="text-2xl mb-4">Match History</h2>
        <MatchHistoryTable matches={matchHistory} matchDetails={matchDetails} />
      </div>
    </div>
  );
}
