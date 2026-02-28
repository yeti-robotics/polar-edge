import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyLabel, TypographyMuted } from "@repo/ui/components/typography";
import { eq } from "drizzle-orm";
import { ChevronLeftIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventOverviewTable } from "@/features/analysis/events/components/EventOverviewTable";
import { EventScopeControls } from "@/features/analysis/events/components/EventScopeControls";
import { EventSummaryCard } from "@/features/analysis/events/components/EventSummaryCard";
import { getMainEventOverviewRow } from "@/features/analysis/events/queries";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { event } from "@/lib/database/schema";
import { routes } from "@/lib/routes";

async function EventAnalysis({
  eventId,
  organizationId,
}: {
  eventId: string;
  organizationId: string | null;
}) {
  const rows = await getMainEventOverviewRow(eventId, { organizationId });
  return (
    <>
      <EventSummaryCard rows={rows} />
      <EventOverviewTable rows={rows} />
    </>
  );
}

function EventAnalysisSkeleton() {
  return (
    <>
      <div className="rounded-lg border p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-md border p-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-2 h-7 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border p-4">
        <Skeleton className="mb-4 h-10 w-full" />
        <Skeleton className="h-90 w-full" />
      </div>
    </>
  );
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ orgScope?: string }>;
}) {
  const { eventId } = await params;
  const { orgScope } = await searchParams;

  let activeMember = null;
  try {
    activeMember = await auth.api.getActiveMember({ headers: await headers() });
  } catch {
    // not signed in
  }

  const organizationId = activeMember?.organizationId ?? null;
  const useOrgScope = orgScope === "1" && organizationId !== null;
  const effectiveOrgId = useOrgScope ? organizationId : null;

  const eventData = await db.query.event.findFirst({ where: eq(event.id, eventId) });
  if (!eventData) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={routes.analysis.events}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeftIcon className="size-4" />
        All Events
      </Link>

      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <TypographyLabel>Event Analysis</TypographyLabel>
          <TypographyH1>{eventData.name}</TypographyH1>
          <TypographyMuted className="mt-1">{eventData.eventCode}</TypographyMuted>
        </div>
        <EventScopeControls hasOrg={organizationId !== null} />
      </div>

      <Suspense fallback={<EventAnalysisSkeleton />}>
        <EventAnalysis eventId={eventId} organizationId={effectiveOrgId} />
      </Suspense>
    </div>
  );
}
