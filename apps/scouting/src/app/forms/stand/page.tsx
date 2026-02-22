import { Card, CardContent, CardFooter } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Suspense } from "react";

function StandFormSkeleton() {
  return (
    <>
      <div className="mb-4">
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <Card>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
        <CardFooter className="flex w-full justify-between">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </CardFooter>
      </Card>
    </>
  );
}

import { TypographyH1 } from "@repo/ui/components/typography";
import { NoActiveEvent } from "@/components/NoActiveEvent";
import {
  StandFormNavigation,
  StandFormProgress,
} from "@/features/scouting/stand/components/StandFormNavigation";
import { StandFormProvider } from "@/features/scouting/stand/components/StandFormProvider";
import { StandFormTabs } from "@/features/scouting/stand/components/StandFormTabs";
import { UnsavedChangesWarning } from "@/features/scouting/stand/components/UnsavedChangesWarning";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";

async function StandFormContent() {
  const member = await requireActiveMember();
  const activeEvent = await getActiveEventForOrganization(member.organizationId);

  if (!activeEvent) {
    return <NoActiveEvent />;
  }

  return (
    <StandFormProvider>
      <UnsavedChangesWarning />
      <div className="mb-4">
        <StandFormProgress />
      </div>

      <Card>
        <CardContent>
          <StandFormTabs />
        </CardContent>
        <CardFooter className="flex w-full justify-between">
          <StandFormNavigation />
        </CardFooter>
      </Card>
    </StandFormProvider>
  );
}

export default function StandFormPage() {
  return (
    <div className="py-6 max-w-3xl w-full mx-auto px-4">
      <TypographyH1 className="mb-6">Stand Form</TypographyH1>

      <main className="w-full">
        <Suspense fallback={<StandFormSkeleton />}>
          <StandFormContent />
        </Suspense>
      </main>
    </div>
  );
}
