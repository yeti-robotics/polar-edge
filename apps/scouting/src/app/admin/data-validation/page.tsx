import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EventSwitcher } from "@/features/validation/components/EventSwitcher";
import { FlaggedFormsTable } from "@/features/validation/components/FlaggedFormsTable";
import { ScoutCoverageGrid } from "@/features/validation/components/ScoutCoverageGrid";
import { ScoreReconciliationTable } from "@/features/validation/components/ScoreReconciliationTable";
import { ValidationSummaryCards } from "@/features/validation/components/ValidationSummaryCards";
import {
  getFlaggedForms,
  getScoutCoverage,
  getValidationMatchScores,
  getValidationSummary,
} from "@/features/validation/queries";
import { routes } from "@/lib/routes";
import { requireAdminMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization, listOrganizationEvents } from "@/lib/server/organization/active-event";

function SummarySkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

async function ValidationContent({ eventId }: { eventId: string }) {
  // This component receives a validated eventId
  const activeMember = await requireAdminMember();
  const { organizationId } = activeMember;

  const [summary, matchScores, coverage, flaggedForms] = await Promise.all([
    getValidationSummary(eventId, organizationId),
    getValidationMatchScores(eventId, organizationId),
    getScoutCoverage(eventId, organizationId),
    getFlaggedForms(eventId, organizationId),
  ]);

  return (
    <div className="space-y-8">
      <ValidationSummaryCards summary={summary} />
      <ScoreReconciliationTable rows={matchScores} totalPlayedCount={summary.playedMatchCount} />
      <ScoutCoverageGrid rows={coverage} />
      {flaggedForms.length > 0 && <FlaggedFormsTable forms={flaggedForms} />}
    </div>
  );
}

export default async function DataValidationPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const activeMember = await requireAdminMember();
  const { organizationId } = activeMember;

  const [activeEvent, orgEvents] = await Promise.all([
    getActiveEventForOrganization(organizationId),
    listOrganizationEvents(organizationId),
  ]);

  const { eventId: searchEventId } = await searchParams;

  // Resolve which event to display
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
        <Suspense fallback={<SummarySkeleton />}>
          <ValidationContent eventId={validEvent.id} />
        </Suspense>
      )}
    </main>
  );
}
