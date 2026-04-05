import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1 } from "@repo/ui/components/typography";
import { Suspense } from "react";
import { NoActiveEvent } from "@/components/NoActiveEvent";
import { DriveRankingForm } from "@/features/scouting/drive-ranking/components/DriveRankingForm";
import { requireScoutLeadMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";

async function DriveRankingContent() {
  const member = await requireScoutLeadMember();
  const activeEvent = await getActiveEventForOrganization(member.organizationId);

  if (!activeEvent?.event) {
    return <NoActiveEvent />;
  }

  return <DriveRankingForm />;
}

function DriveRankingSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default function DriveRankingPage() {
  return (
    <div className="py-6 max-w-3xl w-full mx-auto px-4">
      <TypographyH1 className="mb-6">Drive Team Ranking</TypographyH1>

      <main className="w-full">
        <Suspense fallback={<DriveRankingSkeleton />}>
          <DriveRankingContent />
        </Suspense>
      </main>
    </div>
  );
}
