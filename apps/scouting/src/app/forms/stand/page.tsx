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

import { NoActiveEvent } from "@/components/NoActiveEvent";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { UnsavedChangesWarning } from "./components/UnsavedChangesWarning";
import { StandFormNavigation, StandFormProgress } from "./StandFormNavigation";
import { StandFormProvider } from "./StandFormProvider";
import { StandFormTabs } from "./StandFormTabs";

async function StandFormContent() {
  const member = await requireActiveMember();
  const activeEvent = await getActiveEventForOrganization(
    member.organizationId,
  );

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
      <h1 className="mb-6 text-3xl tracking-tight font-bold">Stand Form</h1>

      <main className="w-full">
        <Suspense fallback={<StandFormSkeleton />}>
          <StandFormContent />
        </Suspense>
      </main>
    </div>
  );
}
