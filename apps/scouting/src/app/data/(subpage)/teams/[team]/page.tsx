import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MatchHistoryTable } from "@/app/data/(subpage)/teams/[team]/MatchHistoryTable";
import { PitPhotoImage } from "@/app/data/(subpage)/teams/[team]/PitPhotoImage";
import { OrganizationFilterToggle } from "@/components/teams/OrganizationFilterToggle";
import { auth } from "@/lib/auth";
import { getTeamInfo, getTeamMatchDetails, getTeamMatchHistory, getTeamPitPhotos } from "./actions";

interface TeamPageProps {
  params: Promise<{ team: string }>;
  searchParams: Promise<{ filterByOrg?: string }>;
}

async function getActiveOrganizationId(): Promise<string | null> {
  try {
    const requestHeaders = await headers();
    const activeMember = await auth.api.getActiveMember({
      headers: requestHeaders,
    });
    return activeMember?.organizationId ?? null;
  } catch {
    return null;
  }
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

  const [teamInfo, matchHistory, pitPhotos] = await Promise.all([
    getTeamInfo(teamNumber),
    getTeamMatchHistory(teamNumber, organizationId, filterByOrgBool),
    getTeamPitPhotos(teamNumber, organizationId),
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

      {pitPhotos.length > 0 && (
        <div>
          <h2 className="text-2xl mb-4">Pit photos</h2>
          <ul className="flex flex-wrap gap-4 list-none p-0 m-0">
            {pitPhotos.map((photo) => (
              <li key={`${photo.storageKey}-${photo.index}`} className="relative">
                <PitPhotoImage
                  src={`/pit-photo?key=${encodeURIComponent(photo.storageKey)}&token=${encodeURIComponent(photo.viewToken)}`}
                  alt={`Robot photo ${photo.index + 1}`}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-2xl mb-4">Match History</h2>
        <MatchHistoryTable matches={matchHistory} matchDetails={matchDetails} />
      </div>
    </div>
  );
}
