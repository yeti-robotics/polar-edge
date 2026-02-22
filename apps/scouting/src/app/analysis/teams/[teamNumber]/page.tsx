import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { TypographyH1, TypographyLabel, TypographyMuted } from "@repo/ui/components/typography";
import { and, desc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import {
  event,
  member,
  pitForm,
  standForm,
  teamMatch,
  team as teamTable,
} from "@/lib/database/schema";
import { getTeamKeyMetrics, getTeamRadarData } from "./queries";
import { TeamKeyMetricsCard } from "./TeamKeyMetricsCard";
import { RadarChart } from "./TeamRadarChart";
import { TeamScopeControls } from "./TeamScopeControls";
import { SelectTeam } from "./TeamSwitcher";

async function TeamKeyMetricsSection({
  teamNum,
  effectiveOrgId,
  effectiveEventId,
}: {
  teamNum: number;
  effectiveOrgId: string | null;
  effectiveEventId: string | null;
}) {
  const metrics = await getTeamKeyMetrics(teamNum, {
    organizationId: effectiveOrgId,
    eventId: effectiveEventId,
  });

  if (!metrics) return null;
  return <TeamKeyMetricsCard metrics={metrics} />;
}

async function TeamRadarSection({
  teamNum,
  effectiveOrgId,
  effectiveEventId,
}: {
  teamNum: number;
  effectiveOrgId: string | null;
  effectiveEventId: string | null;
}) {
  const radarData = await getTeamRadarData(teamNum, {
    organizationId: effectiveOrgId,
    eventId: effectiveEventId,
  });

  return (
    <RadarChart
      data={radarData}
      angleKey="subject"
      valueKey="value"
      name="Score"
      domain={[0, 100]}
    />
  );
}

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamNumber: string }>;
  searchParams: Promise<{ orgScope?: string; eventId?: string }>;
}) {
  const { teamNumber } = await params;
  const { orgScope, eventId: eventIdParam } = await searchParams;

  const teamNum = parseInt(teamNumber, 10);
  const teamResults = await db.select().from(teamTable).where(eq(teamTable.teamNumber, teamNum));
  if (!teamResults || teamResults.length === 0)
    return (
      <div className="p-6">
        <p className="font-mono text-4xl">Team {teamNumber} Not Found</p>
      </div>
    );

  const teamRow = teamResults[0] as NonNullable<(typeof teamResults)[0]>;

  // Optional auth — no redirect, page is public
  let activeMember = null;
  try {
    activeMember = await auth.api.getActiveMember({ headers: await headers() });
  } catch {
    // not signed in
  }

  const organizationId = activeMember?.organizationId ?? null;

  // Resolve effective scope from search params
  // Event filter is independent of org scope
  const effectiveEventId = eventIdParam ?? null;
  const useOrgScope = orgScope === "1" && organizationId !== null;
  const effectiveOrgId = useOrgScope ? organizationId : null;

  const eventSelectShape = {
    id: event.id,
    name: event.name,
    eventCode: event.eventCode,
    startDate: event.startDate,
  };

  const [pitFormData, globalTeamEvents, orgTeamEvents] = await Promise.all([
    db.select().from(pitForm).where(eq(pitForm.teamNumber, teamNum)).limit(1),

    // All events this team has any team_match record for
    db
      .selectDistinct(eventSelectShape)
      .from(teamMatch)
      .innerJoin(event, eq(event.id, teamMatch.eventId))
      .where(eq(teamMatch.teamNumber, teamNum))
      .orderBy(desc(event.startDate)),

    // Events where this org has scouted this team
    organizationId
      ? db
          .selectDistinct(eventSelectShape)
          .from(teamMatch)
          .innerJoin(event, eq(event.id, teamMatch.eventId))
          .innerJoin(
            standForm,
            and(eq(standForm.teamMatchId, teamMatch.id), isNull(standForm.deletedAt))
          )
          .innerJoin(member, eq(member.id, standForm.scoutMemberId))
          .where(and(eq(teamMatch.teamNumber, teamNum), eq(member.organizationId, organizationId)))
          .orderBy(desc(event.startDate))
      : Promise.resolve(
          [] as { id: string; name: string; eventCode: string; startDate: Date | null }[]
        ),
  ]);

  const pitData = pitFormData[0];

  return (
    <div className="space-y-4">
      {/* Page header — intentionally not a Card */}
      <div className="pb-4 border-b">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <TypographyLabel className="mb-1">Team Analysis</TypographyLabel>
            <TypographyH1>{teamRow.teamName}</TypographyH1>
            <TypographyMuted className="mt-1">Team {teamRow.teamNumber}</TypographyMuted>
            <SelectTeam />
          </div>

          <TeamScopeControls
            hasOrg={organizationId !== null}
            globalTeamEvents={globalTeamEvents}
            orgTeamEvents={orgTeamEvents}
          />
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-56 w-full" />}>
        <TeamKeyMetricsSection
          teamNum={teamNum}
          effectiveOrgId={effectiveOrgId}
          effectiveEventId={effectiveEventId}
        />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Suspense fallback={<Skeleton className="h-90 w-full" />}>
          <TeamRadarSection
            teamNum={teamNum}
            effectiveOrgId={effectiveOrgId}
            effectiveEventId={effectiveEventId}
          />
        </Suspense>

        <Card className="w-full pb-32" id="pit-data">
          <CardHeader>
            <CardTitle>Pit Scouting Data</CardTitle>
          </CardHeader>
          <CardContent>
            {!pitData ? (
              <p className="text-muted-foreground">No pit scouting data available</p>
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
                      <div className="flex gap-2 flex-wrap">
                        {pitData.canTrench && <Badge>Trench</Badge>}
                        {pitData.canBump && <Badge>Bump</Badge>}
                        {pitData.canShuttle && <Badge>Shuttle</Badge>}
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
