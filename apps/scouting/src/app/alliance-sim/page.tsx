import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { Suspense } from "react";
import { AllianceSimulator } from "@/features/alliance-sim/components/AllianceSimulator";
import { getSimTeamsForEvent } from "@/features/alliance-sim/queries";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2].map((i) => (
        <Card key={i}>
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

async function AllianceSimContent() {
  const activeMember = await requireActiveMember();
  const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);

  if (!activeEvent?.event) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No active event set. Please configure an event in admin settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const teams = await getSimTeamsForEvent(activeMember.organizationId, activeEvent.event.id);

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No teams found for this event. Sync teams from The Blue Alliance first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <AllianceSimulator teams={teams} />;
}

export default function AllianceSimPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <TypographyH1>Alliance Simulator</TypographyH1>
        <TypographyMuted className="mt-2">
          Build alliances and simulate match outcomes using OpenSkill drive team ratings
        </TypographyMuted>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <AllianceSimContent />
      </Suspense>
    </main>
  );
}
