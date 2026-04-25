import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  TypographyH2,
  TypographyH3,
  TypographyLabel,
  TypographyLarge,
  TypographyMuted,
  TypographySmall,
} from "@repo/ui/components/typography";
import { and, desc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { Suspense } from "react";
import { AdvancedMetricsCard } from "@/features/analysis/components/AdvancedMetricsCard";
import {
  AISummaryContent,
  AISummarySkeleton,
} from "@/features/analysis/components/AISummaryContent";
import { AnimatedSparkles } from "@/features/analysis/components/AnimatedSparkles";
import { ClimbMetricsCard } from "@/features/analysis/components/ClimbMetricsCard";
import { FuelMetricsSection } from "@/features/analysis/components/FuelMetricsSection";
import { ReliabilityMetricsCard } from "@/features/analysis/components/ReliabilityMetricsCard";
import { TeamCommentSummaryCard } from "@/features/analysis/components/TeamCommentSummaryCard";
import { TeamScopeControls } from "@/features/analysis/components/TeamScopeControls";
import { SelectTeam } from "@/features/analysis/components/TeamSwitcher";
import {
  getTeamBpsEstimate,
  getTeamCommentSummary,
  getTeamComments,
  getTeamCycleTimeseries,
  getTeamKeyMetrics,
} from "@/features/analysis/team-queries";
import { DriveRatingCard } from "@/features/scouting/drive-ranking/components/DriveRatingCard";
import { DriveRatingHistoryChart } from "@/features/scouting/drive-ranking/components/DriveRatingHistory";
import {
  getDriveRatingHistory,
  getDriveTeamRatings,
} from "@/features/scouting/drive-ranking/queries";
import { formatPitDrivetrain } from "@/features/scouting/pit/types";
import { TeamWorkabilityCard } from "@/features/scouting/workability/components/TeamWorkabilityCard";
import { getTeamWorkabilitySummary } from "@/features/scouting/workability/queries";
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

async function FuelPerformanceSection({ teamNum, effectiveOrgId, effectiveEventId }: ScopeProps) {
  const [metrics, bps, timeseries] = await Promise.all([
    getTeamKeyMetrics(teamNum, {
      organizationId: effectiveOrgId,
      eventId: effectiveEventId,
    }),
    getTeamBpsEstimate(teamNum, {
      organizationId: effectiveOrgId,
      eventId: effectiveEventId,
    }),
    getTeamCycleTimeseries(teamNum, {
      organizationId: effectiveOrgId,
      eventId: effectiveEventId,
    }),
  ]);

  if (!metrics) return null;
  return <FuelMetricsSection metrics={metrics} bps={bps} timeseries={timeseries} />;
}

async function ReliabilitySection({ teamNum, effectiveOrgId, effectiveEventId }: ScopeProps) {
  const metrics = await getTeamKeyMetrics(teamNum, {
    organizationId: effectiveOrgId,
    eventId: effectiveEventId,
  });
  if (!metrics) return null;
  return <ReliabilityMetricsCard metrics={metrics} />;
}

async function AdvancedMetricsSection({ teamNum, effectiveOrgId, effectiveEventId }: ScopeProps) {
  const metrics = await getTeamKeyMetrics(teamNum, {
    organizationId: effectiveOrgId,
    eventId: effectiveEventId,
  });
  if (!metrics) return null;
  return <AdvancedMetricsCard metrics={metrics} />;
}

async function ClimbSection({ teamNum, effectiveOrgId, effectiveEventId }: ScopeProps) {
  const metrics = await getTeamKeyMetrics(teamNum, {
    organizationId: effectiveOrgId,
    eventId: effectiveEventId,
  });
  if (!metrics) return null;
  return <ClimbMetricsCard metrics={metrics} />;
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

async function WorkabilitySection({
  teamNum,
  organizationId,
  effectiveEventId,
}: {
  teamNum: number;
  organizationId: string | null;
  effectiveEventId: string | null;
}) {
  if (!organizationId) return null;

  const summary = await getTeamWorkabilitySummary(teamNum, organizationId, effectiveEventId);
  return <TeamWorkabilityCard summary={summary} />;
}

function PitStatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/20 px-4 py-3">
      <TypographyLabel>{label}</TypographyLabel>
      <TypographySmall className="font-semibold">{value}</TypographySmall>
    </div>
  );
}

async function PitDataSection({ teamNum }: { teamNum: number }) {
  const pitFormData = await db
    .select()
    .from(pitForm)
    .where(eq(pitForm.teamNumber, teamNum))
    .orderBy(desc(pitForm.createdAt))
    .limit(1);
  const pitData = pitFormData[0];

  if (!pitData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Robot Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>No pit scouting data available</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  const capabilities = [
    pitData.canTrench && "Trench",
    pitData.canBump && "Bump",
    pitData.canShuttle && "Shuttle",
  ].filter((c): c is string => Boolean(c));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Robot Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PitStatCard
            label="Drivetrain"
            value={formatPitDrivetrain(pitData.drivetrainType, pitData.drivetrainOther)}
          />
          {pitData.archetype && <PitStatCard label="Archetype" value={pitData.archetype} />}
          <PitStatCard label="Weight" value={`${pitData.weight} lbs`} />
          <PitStatCard label="Capacity" value={pitData.capacity} />
          <PitStatCard label="Climb Type" value={pitData.climbType || "N/A"} />
          <PitStatCard
            label="Capabilities"
            value={
              capabilities.length > 0 ? (
                <div className="flex gap-1.5 flex-wrap">
                  {capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">None</span>
              )
            }
          />
        </div>
        {pitData.comments && (
          <div className="space-y-1.5 rounded-lg border bg-muted/10 px-4 py-3">
            <TypographyLabel>Pit Notes</TypographyLabel>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {pitData.comments}
            </p>
          </div>
        )}
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
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <TypographyLarge className="text-6xl font-bold tabular-nums text-muted-foreground/30">
            {teamNumber}
          </TypographyLarge>
          <TypographyMuted className="mt-2">Team not found</TypographyMuted>
        </div>
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
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-lg font-bold tabular-nums text-primary">
              {teamRow.teamNumber}
            </span>
            <TypographyH2 className="truncate">{teamRow.teamName}</TypographyH2>
          </div>
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <SelectTeam />
            <TeamScopeControls
              hasOrg={organizationId !== null}
              globalTeamEvents={globalTeamEvents}
              orgTeamEvents={orgTeamEvents}
            />
          </div>
        </div>
      </div>

      {/* ── AI Summary ────────────────────────────────────────── */}
      <Card className="gap-y-3 border-primary/20 bg-gradient-to-b from-primary/[0.03] to-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AnimatedSparkles />
            <TypographyH3>AI Summary</TypographyH3>
          </div>
          <TypographyMuted>AI-generated analysis based on scout observations</TypographyMuted>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<AISummarySkeleton />}>
            <AISummarySection {...scopeProps} />
          </Suspense>
        </CardContent>
      </Card>

      {/* ── Fuel Performance ──────────────────────────────────── */}
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <FuelPerformanceSection {...scopeProps} />
      </Suspense>

      {/* ── Reliability ───────────────────────────────────────── */}
      <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
        <ReliabilitySection {...scopeProps} />
      </Suspense>

      {/* ── Advanced Metrics ──────────────────────────────────── */}
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
        <AdvancedMetricsSection {...scopeProps} />
      </Suspense>

      {/* ── Scout Comments ─────────────────────────────────────── */}
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
        <TeamCommentsSection {...scopeProps} isOrgAdmin={isOrgAdmin} />
      </Suspense>

      {/* ── Robot Profile ──────────────────────────────────────── */}
      <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
        <PitDataSection teamNum={teamNum} />
      </Suspense>

      {/* ── Climb Performance ─────────────────────────────────── */}
      <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
        <ClimbSection {...scopeProps} />
      </Suspense>

      {/* ── Drive Rating ───────────────────────────────────────── */}
      <Suspense fallback={<Skeleton className="h-56 w-full rounded-lg" />}>
        <DriveRatingSection
          teamNum={teamNum}
          organizationId={organizationId}
          effectiveEventId={effectiveEventId}
        />
      </Suspense>

      {/* ── Workability ────────────────────────────────────────── */}
      <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
        <WorkabilitySection
          teamNum={teamNum}
          organizationId={organizationId}
          effectiveEventId={effectiveEventId}
        />
      </Suspense>
    </div>
  );
}
