import { TabsContent } from "@repo/ui/components/tabs";
import { Suspense } from "react";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { AutoTabContent } from "./AutoTabContent";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { PitTabContent } from "./PitTabContent";
import { StandTabContent } from "./StandTabContent";

type Props = {
  searchParams: Promise<{ event?: string }>;
};

export async function LeaderboardContent({ searchParams }: Props) {
  const member = await requireActiveMember();
  const { organizationId } = member;
  const { event: eventParam } = await searchParams;

  return (
    <>
      <TabsContent value="stand" className="space-y-6 pt-2">
        <Suspense fallback={<LoadingSkeleton />}>
          <StandTabContent organizationId={organizationId} eventParam={eventParam ?? null} />
        </Suspense>
      </TabsContent>

      <TabsContent value="pit" className="space-y-6 pt-2">
        <Suspense fallback={<LoadingSkeleton />}>
          <PitTabContent organizationId={organizationId} />
        </Suspense>
      </TabsContent>

      <TabsContent value="auto" className="space-y-6 pt-2">
        <Suspense fallback={<LoadingSkeleton />}>
          <AutoTabContent organizationId={organizationId} />
        </Suspense>
      </TabsContent>
    </>
  );
}
