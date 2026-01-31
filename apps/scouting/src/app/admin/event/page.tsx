import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getActiveEventForOrganization, listEvents } from "@/lib/server/organization/active-event";
import { ActiveEventForm } from "./ActiveEventForm";
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
  const requestHeaders = await headers();
  const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

  if (activeMember?.role !== "admin" && activeMember?.role !== "owner") {
    redirect("/");
  }

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
    </div>
  );
}

export default function AdminEventPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Active Event</h1>
        <p className="mt-2 text-muted-foreground">
          Set the event your organization is currently focused on
        </p>
      </div>
      <Suspense fallback={<LoadingForm />}>
        <EventContent />
      </Suspense>
    </main>
  );
}
