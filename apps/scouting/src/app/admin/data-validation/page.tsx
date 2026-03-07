import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EventSwitcher } from "@/features/validation/components/EventSwitcher";
import { FlaggedFormsTable } from "@/features/validation/components/FlaggedFormsTable";
import { ScoreReconciliationTable } from "@/features/validation/components/ScoreReconciliationTable";
import { ScoutCoverageGrid } from "@/features/validation/components/ScoutCoverageGrid";
import { ValidationSummaryCards } from "@/features/validation/components/ValidationSummaryCards";
import {
  getFlaggedForms,
  getScoutCoverage,
  getValidationMatchScores,
  getValidationSummary,
} from "@/features/validation/queries";
import { routes } from "@/lib/routes";
import { requireAdminMember } from "@/lib/server/auth/require-member";
import {
  getActiveEventForOrganization,
  listOrganizationEvents,
} from "@/lib/server/organization/active-event";

// ── Skeletons ─────────────────────────────────────────────────────────────────

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={`w-full rounded-xl ${className ?? "h-64"}`} />;
}

// ── Section components (each streams independently) ───────────────────────────

type SectionProps = { eventId: string; organizationId: string };

async function SummarySection({ eventId, organizationId }: SectionProps) {
  const summary = await getValidationSummary(eventId, organizationId);
  return <ValidationSummaryCards summary={summary} />;
}

async function ScoreSection({ eventId, organizationId }: SectionProps) {
  // getValidationSummary calls getValidationMatchScores internally (cached),
  // so this Promise.all results in only one DB round-trip for matchScores.
  const [matchScores, summary] = await Promise.all([
    getValidationMatchScores(eventId, organizationId),
    getValidationSummary(eventId, organizationId),
  ]);
  return (
    <ScoreReconciliationTable rows={matchScores} totalPlayedCount={summary.playedMatchCount} />
  );
}

async function CoverageSection({ eventId, organizationId }: SectionProps) {
  const coverage = await getScoutCoverage(eventId, organizationId);
  return <ScoutCoverageGrid rows={coverage} />;
}

async function FlaggedSection({ eventId, organizationId }: SectionProps) {
  const forms = await getFlaggedForms(eventId, organizationId);
  if (forms.length === 0) return null;
  return <FlaggedFormsTable forms={forms} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DataValidationPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const activeMember = await requireAdminMember();
  const { organizationId } = activeMember;

  const [activeEvent, orgEvents, { eventId: searchEventId }] = await Promise.all([
    getActiveEventForOrganization(organizationId),
    listOrganizationEvents(organizationId),
    searchParams,
  ]);

  const validEvent =
    orgEvents.find((e) => e.id === searchEventId) ??
    (activeEvent ? orgEvents.find((e) => e.id === activeEvent.eventId) : null) ??
    null;

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <TypographyH1>Data Validation</TypographyH1>
          <TypographyMuted className="mt-2">
            Audit scouting accuracy and coverage — all metrics scoped to your organization
          </TypographyMuted>
        </div>
        {orgEvents.length > 0 && validEvent && (
          <Suspense>
            <EventSwitcher
              events={orgEvents.map((e) => ({ id: e.id, name: e.name, eventCode: e.eventCode }))}
              selectedEventId={validEvent.id}
            />
          </Suspense>
        )}
      </div>

      {!validEvent ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CalendarIcon className="size-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">No active event</p>
              <TypographyMuted className="mt-1">
                Set an active event to start validating scouting data.
              </TypographyMuted>
            </div>
            <Link
              href={routes.admin.event}
              className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
            >
              Go to Active Event settings
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <Suspense fallback={<SummaryCardsSkeleton />}>
            <SummarySection eventId={validEvent.id} organizationId={organizationId} />
          </Suspense>
          <Suspense fallback={<CardSkeleton className="h-64" />}>
            <ScoreSection eventId={validEvent.id} organizationId={organizationId} />
          </Suspense>
          <Suspense fallback={<CardSkeleton className="h-48" />}>
            <CoverageSection eventId={validEvent.id} organizationId={organizationId} />
          </Suspense>
          <Suspense>
            <FlaggedSection eventId={validEvent.id} organizationId={organizationId} />
          </Suspense>
        </div>
      )}
    </main>
  );
}
