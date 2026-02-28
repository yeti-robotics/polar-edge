import { Badge } from "@repo/ui/components/badge";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { headers } from "next/headers";
import Link from "next/link";
import { EventSelectorControls } from "@/features/analysis/events/components/EventSelectorControls";
import { listAllEvents } from "@/features/analysis/events/queries";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";
import { listOrganizationEvents } from "@/lib/server/organization/active-event";

export default async function EventOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ orgOnly?: string }>;
}) {
  const { orgOnly } = await searchParams;

  let activeMember = null;
  try {
    activeMember = await auth.api.getActiveMember({ headers: await headers() });
  } catch {
    // not signed in
  }

  const organizationId = activeMember?.organizationId ?? null;

  const [allEvents, orgEvents] = await Promise.all([
    listAllEvents(),
    organizationId ? listOrganizationEvents(organizationId) : Promise.resolve([]),
  ]);

  const showOrgOnly = orgOnly === "1" && organizationId !== null;
  const orgEventIds = new Set(orgEvents.map((e) => e.id));

  const displayEvents = (showOrgOnly ? orgEvents : allEvents).map((e) => ({
    ...e,
    isOrgEvent: orgEventIds.has(e.id),
    isActive:
      (orgEvents.find((oe) => oe.id === e.id) as { isActive?: boolean } | undefined)?.isActive ??
      false,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <TypographyH1>Event Overview</TypographyH1>
          <TypographyMuted className="mt-1">Select an event to view analysis</TypographyMuted>
        </div>
        <EventSelectorControls hasOrg={organizationId !== null} />
      </div>

      {displayEvents.length === 0 ? (
        <p className="text-muted-foreground">No events found.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayEvents.map((e) => (
            <Link
              key={e.id}
              href={routes.analysis.event(e.id)}
              className="rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium leading-tight truncate">{e.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{e.eventCode}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {e.isActive && <Badge variant="default">Active</Badge>}
                  {e.isOrgEvent && !e.isActive && <Badge variant="secondary">My Org</Badge>}
                </div>
              </div>
              {(e.startDate ?? e.endDate) && (
                <p className="text-xs text-muted-foreground mt-2">
                  {e.startDate ? new Date(e.startDate).toLocaleDateString() : ""}
                  {e.startDate && e.endDate ? " – " : ""}
                  {e.endDate ? new Date(e.endDate).toLocaleDateString() : ""}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
