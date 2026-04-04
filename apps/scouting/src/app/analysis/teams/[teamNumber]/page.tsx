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
import {
  TypographyH1,
  TypographyH3,
  TypographyLabel,
  TypographyMuted,
} from "@repo/ui/components/typography";
import { and, desc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { Suspense } from "react";
import {
  AISummaryContent,
  AISummarySkeleton,
} from "@/features/analysis/components/AISummaryContent";
import { AnimatedSparkles } from "@/features/analysis/components/AnimatedSparkles";
import { TeamCommentSummaryCard } from "@/features/analysis/components/TeamCommentSummaryCard";
import { TeamKeyMetricsCard } from "@/features/analysis/components/TeamKeyMetricsCard";
import { TeamScopeControls } from "@/features/analysis/components/TeamScopeControls";
import { SelectTeam } from "@/features/analysis/components/TeamSwitcher";
import {
  getTeamCommentSummary,
  getTeamComments,
  getTeamKeyMetrics,
} from "@/features/analysis/team-queries";
import { DriveRatingCard } from "@/features/scouting/drive-ranking/components/DriveRatingCard";
import { DriveRatingHistoryChart } from "@/features/scouting/drive-ranking/components/DriveRatingHistory";
import {
  getDriveRatingHistory,
  getDriveTeamRatings,
} from "@/features/scouting/drive-ranking/queries";
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

type ScopeProps = {
  teamNum: number;
  effectiveOrgId: string | null;
  effectiveEventId: string | null;
};

async function TeamKeyMetricsSection({ teamNum, effectiveOrgId, effectiveEventId }: ScopeProps) {
  const metrics = await getTeamKeyMetrics(teamNum, {
    organizationId: effectiveOrgId,
    eventId: effectiveEventId,
  });

  if (!metrics) return null;
  return <TeamKeyMetricsCard metrics={metrics} />;
}

async function AISummarySection({ teamNum, effectiveOrgId, effectiveEventId }: ScopeProps) {
  const result = await getTeamCommentSummary(teamNum, {
    organizationId: effectiveOrgId,
    eventId: effectiveEventId,
  });
  if (!result) return null;
  return <AISummaryContent summary={result} />;
}

async function TeamCommentsSection({
  teamNum,
  effectiveOrgId,
  effectiveEventId,
  isOrgAdmin,
}: ScopeProps & { isOrgAdmin: boolean }) {
  const comments = await getTeamComments(teamNum, {
    organizationId: effectiveOrgId,
    eventId: effectiveEventId,
  });

  if (comments.length === 0) return null;

  return (
    <TeamCommentSummaryCard
      commentCount={comments.length}
      comments={comments}
      showScoutNames={isOrgAdmin}
    />
  );
}

async function DriveRatingSection({
  teamNum,
  organizationId,
  effectiveEventId,
}: {
  teamNum: number;
  organizationId: string | null;
  effectiveEventId: string | null;
}) {
  if (!organizationId) return null;

  const [ratings, history] = await Promise.all([
    getDriveTeamRatings(organizationId, effectiveEventId),
    getDriveRatingHistory(teamNum, organizationId, effectiveEventId),
  ]);

  const teamRating = ratings.find((r) => r.teamNumber === teamNum) ?? null;

  return (
    <div className="space-y-4">
      <DriveRatingCard rating={teamRating} />
      <DriveRatingHistoryChart history={history} />
    </div>
  );
}

async function PitDataSection({ teamNum }: { teamNum: number }) {
  const pitFormData = await db
    .select()
    .from(pitForm)
    .where(eq(pitForm.teamNumber, teamNum))
    .limit(1);
  const pitData = pitFormData[0];

  if (!pitData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pit Scouting Data</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>No pit scouting data available</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pit Scouting Data</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamNumber: string }>;
  searchParams: Promise<{ orgScope?: string; eventId?: string }>;
}) {
  const [{ teamNumber }, { orgScope, eventId: eventIdParam }] = await Promise.all([
    params,
    searchParams,
  ]);

  const teamNum = parseInt(teamNumber, 10);
  const teamResults = await db.select().from(teamTable).where(eq(teamTable.teamNumber, teamNum));
  if (!teamResults || teamResults.length === 0)
    return (
      <div className="p-6">
        <p className="font-mono text-4xl">Team {teamNumber} Not Found</p>
      </div>
    );

  const teamRow = teamResults[0] as NonNullable<(typeof teamResults)[0]>;

  let activeMember = null;
  try {
    activeMember = await auth.api.getActiveMember({ headers: await headers() });
  } catch {
    // not signed in
  }

  const organizationId = activeMember?.organizationId ?? null;
  const isOrgAdmin = activeMember?.role === "admin" || activeMember?.role === "owner";

  const effectiveEventId = eventIdParam ?? null;
  const useOrgScope = orgScope === "1" && organizationId !== null;
  const effectiveOrgId = useOrgScope ? organizationId : null;

  const eventSelectShape = {
    id: event.id,
    name: event.name,
    eventCode: event.eventCode,
    startDate: event.startDate,
  };

  const [globalTeamEvents, orgTeamEvents] = await Promise.all([
    db
      .selectDistinct(eventSelectShape)
      .from(teamMatch)
      .innerJoin(event, eq(event.id, teamMatch.eventId))
      .where(eq(teamMatch.teamNumber, teamNum))
      .orderBy(desc(event.startDate)),

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

  const scopeProps: ScopeProps = {
    teamNum,
    effectiveOrgId,
    effectiveEventId,
  };

  return (
    <div className="space-y-4">
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
        <TeamKeyMetricsSection {...scopeProps} />
      </Suspense>

      <Card className="gap-y-3">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AnimatedSparkles />
            <TypographyH3>Scout Insights</TypographyH3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<AISummarySkeleton />}>
            <AISummarySection {...scopeProps} />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
            <TeamCommentsSection {...scopeProps} isOrgAdmin={isOrgAdmin} />
          </Suspense>
        </CardContent>
      </Card>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <PitDataSection teamNum={teamNum} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-56 w-full" />}>
        <DriveRatingSection
          teamNum={teamNum}
          organizationId={organizationId}
          effectiveEventId={effectiveEventId}
        />
      </Suspense>
    </div>
  );
}
