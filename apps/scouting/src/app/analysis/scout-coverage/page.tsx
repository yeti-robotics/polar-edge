import { Card, CardContent } from "@repo/ui/components/card";
import {
  TypographyH1,
  TypographyLabel,
  TypographyMuted,
} from "@repo/ui/components/typography";
import { CalendarIcon } from "lucide-react";
import { headers } from "next/headers";
import { Suspense } from "react";
import {
  ScoutCoverageSection,
  ScoutCoverageSectionSkeleton,
} from "@/features/analysis/components/ScoutCoverageSection";
import { listAllEvents } from "@/features/analysis/events/queries";
import { EventSwitcher } from "@/features/validation/components/EventSwitcher";
import { auth } from "@/lib/auth";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";

export default async function ScoutCoveragePage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId: searchEventId } = await searchParams;

  let organizationId: string | null = null;
  try {
    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    organizationId = activeMember?.organizationId ?? null;
  } catch {
    // not signed in
  }

  const [events, activeOrgEvent] = await Promise.all([
    listAllEvents(),
    organizationId ? getActiveEventForOrganization(organizationId) : Promise.resolve(null),
  ]);

  const selectedEvent =
    events.find((event) => event.id === searchEventId) ??
    (activeOrgEvent ? events.find((event) => event.id === activeOrgEvent.eventId) : null) ??
    events[0] ??
    null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <TypographyH1>Scout Coverage</TypographyH1>
          <TypographyMuted className="mt-1 max-w-2xl">
            See which qualification match slots are missing stand forms so users can spot
            scouting gaps by competition.
          </TypographyMuted>
        </div>
        {selectedEvent && (
          <div className="space-y-1">
            <TypographyLabel className="text-muted-foreground">Competition</TypographyLabel>
            <EventSwitcher
              events={events.map((event) => ({
                id: event.id,
                name: event.name,
                eventCode: event.eventCode,
              }))}
              selectedEventId={selectedEvent.id}
            />
          </div>
        )}
      </div>

      {!selectedEvent ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CalendarIcon className="size-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">No competitions available</p>
              <TypographyMuted className="mt-1">
                Import an event to start tracking scout coverage.
              </TypographyMuted>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Suspense fallback={<ScoutCoverageSectionSkeleton />}>
          <ScoutCoverageSection eventId={selectedEvent.id} />
        </Suspense>
      )}
    </div>
  );
}
