import { Card, CardContent } from "@repo/ui/components/card";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Suspense } from "react";
import { requireAdminMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization, listEvents } from "@/lib/server/organization/active-event";
import { ActiveEventForm } from "./ActiveEventForm";
import { EnrichTeamNamesForm } from "./EnrichTeamNamesForm";
import { SyncFromTBAForm } from "./SyncFromTBAForm";

function LoadingForm() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-10 w-full max-w-[320px]" />
        <Skeleton className="mt-4 h-9 w-20" />
      </CardContent>
    </Card>
  );
}

async function EventContent() {
  const activeMember = await requireAdminMember();
  const organizationId = activeMember.organizationId;
  const [activeEvent, events] = await Promise.all([
    getActiveEventForOrganization(organizationId),
    listEvents(),
  ]);

  return (
    <div className="space-y-6">
      <ActiveEventForm
        organizationId={organizationId}
        events={events.map((e) => ({
          id: e.id,
          eventCode: e.eventCode,
          name: e.name,
          startDate: e.startDate,
          endDate: e.endDate,
        }))}
        activeEventId={activeEvent?.eventId ?? null}
      />
      <SyncFromTBAForm organizationId={organizationId} />
      <EnrichTeamNamesForm organizationId={organizationId} />
    </div>
  );
}

export default function AdminEventPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <TypographyH1>Active Event</TypographyH1>
        <TypographyMuted className="mt-2">
          Set the event your organization is currently focused on
        </TypographyMuted>
      </div>
      <Suspense fallback={<LoadingForm />}>
        <EventContent />
      </Suspense>
    </main>
  );
}
