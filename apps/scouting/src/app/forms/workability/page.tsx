import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { Suspense } from "react";
import { NoActiveEvent } from "@/components/NoActiveEvent";
import { getEventTeams } from "@/features/scouting/pit/queries";
import { WorkabilityForm } from "@/features/scouting/workability/components/WorkabilityForm";
import { getMemberWorkabilitySubmissions } from "@/features/scouting/workability/queries";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";

function WorkabilityFormSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((value) => (
        <Card key={value}>
          <CardContent className="space-y-4 py-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function WorkabilityFormContent() {
  const member = await requireActiveMember();
  const activeEvent = await getActiveEventForOrganization(member.organizationId);

  if (!activeEvent?.event) {
    return <NoActiveEvent />;
  }

  const [teams, submissions] = await Promise.all([
    getEventTeams(activeEvent.event.id),
    getMemberWorkabilitySubmissions(activeEvent.event.id, member.id),
  ]);

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No teams are available for the active event yet.
        </CardContent>
      </Card>
    );
  }

  return <WorkabilityForm teams={teams} initialSubmissions={submissions} />;
}

export default function WorkabilityFormPage() {
  return (
    <main className="container mx-auto max-w-4xl px-5 py-6">
      <div className="mb-6">
        <TypographyH1>Workability Form</TypographyH1>
        <TypographyMuted className="mt-2"></TypographyMuted>
      </div>
      <Suspense fallback={<WorkabilityFormSkeleton />}>
        <WorkabilityFormContent />
      </Suspense>
    </main>
  );
}
