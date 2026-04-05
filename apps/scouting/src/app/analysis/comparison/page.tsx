import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyLabel, TypographyMuted } from "@repo/ui/components/typography";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { Suspense } from "react";
import { ComparisonMetricsTable } from "@/features/analysis/components/ComparisonMetricsTable";
import { ComparisonPitData } from "@/features/analysis/components/ComparisonPitData";
import { ComparisonScopeControls } from "@/features/analysis/components/ComparisonScopeControls";
import { ComparisonTeamHeader } from "@/features/analysis/components/ComparisonTeamHeader";
import { ComparisonTeamSelector } from "@/features/analysis/components/ComparisonTeamSelector";
import { getTeamKeyMetrics } from "@/features/analysis/team-queries";
import { ComparisonDriveRating } from "@/features/scouting/drive-ranking/components/ComparisonDriveRating";
import {
  getDriveRatingHistory,
  getDriveTeamRatings,
} from "@/features/scouting/drive-ranking/queries";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { event, member, standForm, team, teamMatch } from "@/lib/database/schema";
import { routes } from "@/lib/routes";

async function ComparisonMetricsSection({
  teamNums,
  teamNameMap,
  effectiveOrgId,
  effectiveEventId,
}: {
  teamNums: number[];
  teamNameMap: Map<number, string>;
  effectiveOrgId: string | null;
  effectiveEventId: string | null;
}) {
  const allMetrics = await Promise.all(
    teamNums.map((n) =>
      getTeamKeyMetrics(n, { organizationId: effectiveOrgId, eventId: effectiveEventId })
    )
  );
  const teamNames = teamNums.map((n) => teamNameMap.get(n) ?? null);
  return (
    <ComparisonMetricsTable
      teamNumbers={teamNums}
      teamNames={teamNames}
      metricsPerTeam={allMetrics}
    />
  );
}

async function ComparisonDriveRatingSection({
  teamNums,
  teamNames,
  organizationId,
  effectiveEventId,
}: {
  teamNums: number[];
  teamNames: (string | null)[];
  organizationId: string | null;
  effectiveEventId: string | null;
}) {
  if (!organizationId) return null;

  const [ratings, ...histories] = await Promise.all([
    getDriveTeamRatings(organizationId, effectiveEventId),
    ...teamNums.map((n) => getDriveRatingHistory(n, organizationId, effectiveEventId)),
  ]);

  const ratingsPerTeam = teamNums.map((n) => ratings.find((r) => r.teamNumber === n) ?? null);

  return (
    <ComparisonDriveRating
      teamNumbers={teamNums}
      teamNames={teamNames}
      ratingsPerTeam={ratingsPerTeam}
      historyPerTeam={histories}
    />
  );
}

export default async function ComparisonPage({
  searchParams,
}: {
  searchParams: Promise<{ teams?: string; orgScope?: string; eventId?: string }>;
}) {
  const { teams: teamsParam, orgScope, eventId: eventIdParam } = await searchParams;

  // Parse team numbers from URL (up to 5, valid positive integers only)
  const teamNums = (teamsParam ?? "")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 5);

  // Optional auth — no redirect, page is public
  let activeMember = null;
  try {
    activeMember = await auth.api.getActiveMember({ headers: await headers() });
  } catch {
    // not signed in
  }

  const organizationId = activeMember?.organizationId ?? null;

  // Resolve effective scope
  const effectiveEventId = eventIdParam ?? null;
  const useOrgScope = orgScope === "1" && organizationId !== null;
  const effectiveOrgId = useOrgScope ? organizationId : null;

  const eventSelectShape = {
    id: event.id,
    name: event.name,
    eventCode: event.eventCode,
    startDate: event.startDate,
  };

  // Parallel-fetch event lists and team names
  const [globalEvents, orgEvents, teamRows] = await Promise.all([
    db
      .selectDistinct(eventSelectShape)
      .from(event)
      .innerJoin(teamMatch, eq(teamMatch.eventId, event.id))
      .orderBy(desc(event.startDate)),

    organizationId
      ? db
          .selectDistinct(eventSelectShape)
          .from(standForm)
          .innerJoin(member, eq(member.id, standForm.scoutMemberId))
          .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
          .innerJoin(event, eq(event.id, teamMatch.eventId))
          .where(and(eq(member.organizationId, organizationId), isNull(standForm.deletedAt)))
          .orderBy(desc(event.startDate))
      : Promise.resolve(
          [] as { id: string; name: string; eventCode: string; startDate: Date | null }[]
        ),

    teamNums.length > 0
      ? db
          .select({ teamNumber: team.teamNumber, teamName: team.teamName })
          .from(team)
          .where(inArray(team.teamNumber, teamNums))
      : Promise.resolve([] as { teamNumber: number; teamName: string }[]),
  ]);

  const teamNameMap = new Map(teamRows.map((r) => [r.teamNumber, r.teamName]));
  const teamNames = teamNums.map((n) => teamNameMap.get(n) ?? null);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={routes.analysis.root}>Analysis</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={routes.analysis.comparison}>Compare</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <TypographyLabel className="mb-1">Team Analysis</TypographyLabel>
            <TypographyH1>Comparison</TypographyH1>
            <TypographyMuted className="mt-1">Compare up to 5 teams side by side</TypographyMuted>
          </div>

          <ComparisonScopeControls
            hasOrg={organizationId !== null}
            globalEvents={globalEvents}
            orgEvents={orgEvents}
          />
        </div>
      </div>

      <ComparisonTeamSelector selectedTeams={teamNums} />

      {teamNums.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <p className="text-muted-foreground">Add teams above to start comparing</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero header */}
          <ComparisonTeamHeader teamNumbers={teamNums} teamNames={teamNames} />

          {/* Metrics table */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <ComparisonMetricsSection
              teamNums={teamNums}
              teamNameMap={teamNameMap}
              effectiveOrgId={effectiveOrgId}
              effectiveEventId={effectiveEventId}
            />
          </Suspense>

          {/* Drive team skill comparison */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <ComparisonDriveRatingSection
              teamNums={teamNums}
              teamNames={teamNames}
              organizationId={organizationId}
              effectiveEventId={effectiveEventId}
            />
          </Suspense>

          {/* Pit scouting side-by-side */}
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <ComparisonPitData teamNumbers={teamNums} teamNames={teamNames} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
