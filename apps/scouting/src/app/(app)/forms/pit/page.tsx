import { Skeleton } from "@repo/ui/components/skeleton";
import { Suspense } from "react";
import { NoActiveEvent } from "@/components/NoActiveEvent";
import { PitForm } from "@/features/scouting/pit/components/PitForm";
import { getEventTeams } from "@/features/scouting/pit/queries";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";

function PitFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

async function PitFormContent() {
  const member = await requireActiveMember();
  const activeEvent = await getActiveEventForOrganization(member.organizationId);

  if (!activeEvent) {
    return <NoActiveEvent />;
  }

  const eventTeams = await getEventTeams(activeEvent.eventId);

  return <PitForm teams={eventTeams} />;
}

export default function PitFormPage() {
  return (
    <main className="container mx-auto max-w-3xl px-5 py-6">
      <h1 className="mb-6 text-3xl tracking-tight">Pit Scout</h1>
      <Suspense fallback={<PitFormSkeleton />}>
        <PitFormContent />
      </Suspense>
    </main>
  );
}
