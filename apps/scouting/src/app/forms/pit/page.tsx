import { Skeleton } from "@repo/ui/components/skeleton";
import { asc, eq } from "drizzle-orm";
import { Suspense } from "react";

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

import { NoActiveEvent } from "@/components/NoActiveEvent";
import { db } from "@/lib/database";
import { team, teamMatch } from "@/lib/database/schema";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { PitForm } from "./PitForm";

async function PitFormContent() {
  const member = await requireActiveMember();
  const activeEvent = await getActiveEventForOrganization(
    member.organizationId,
  );

  if (!activeEvent) {
    return <NoActiveEvent />;
  }

  const eventTeams = await db
    .selectDistinct({
      teamNumber: team.teamNumber,
      teamName: team.teamName,
    })
    .from(teamMatch)
    .innerJoin(team, eq(team.teamNumber, teamMatch.teamNumber))
    .where(eq(teamMatch.eventId, activeEvent.eventId))
    .orderBy(asc(team.teamNumber));

  return <PitForm teams={eventTeams} />;
}

export default function PitFormPage() {
  return (
    <main className="container mx-auto max-w-3xl px-5 py-6">
      <h1 className="mb-6 text-3xl tracking-tight font-bold">Pit Scout</h1>
      <Suspense fallback={<PitFormSkeleton />}>
        <PitFormContent />
      </Suspense>
    </main>
  );
}
