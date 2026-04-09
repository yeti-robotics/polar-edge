import { headers } from "next/headers";
import { Suspense } from "react";
import { NoActiveEvent } from "@/components/NoActiveEvent";
import { AdminScheduleButton } from "@/features/shift-schedule/components/AdminScheduleButton";
import { ShiftSchedulePage } from "@/features/shift-schedule/components/ShiftSchedulePage";
import { getShiftScheduleForActiveEvent } from "@/features/shift-schedule/queries";
import { buildStandMatchBlocks } from "@/features/shift-schedule/types";
import { auth } from "@/lib/auth";
import { requireActiveMember } from "@/lib/server/auth/require-member";

async function ShiftScheduleContent() {
  const activeMember = await requireActiveMember();
  const requestHeaders = await headers();
  const [{ activeEvent, entries, matchNumbers }, membersResponse] = await Promise.all([
    getShiftScheduleForActiveEvent(activeMember.organizationId),
    auth.api.listMembers({
      query: {
        organizationId: activeMember.organizationId,
        sortBy: "createdAt",
        sortDirection: "asc",
      },
      headers: requestHeaders,
    }),
  ]);

  if (!activeEvent) {
    return <NoActiveEvent />;
  }

  const organizationMembers = (membersResponse?.members ?? []).map((member) => ({
    id: member.id,
    name: member.user.name,
    email: member.user.email,
  }));

  const adminAction =
    activeMember.role === "admin" || activeMember.role === "owner" ? (
      <AdminScheduleButton
        initialEntries={entries}
        organizationMembers={organizationMembers}
        matchBlocks={buildStandMatchBlocks(matchNumbers)}
      />
    ) : null;

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <ShiftSchedulePage
        activeMemberId={activeMember.id}
        adminAction={adminAction}
        eventName={activeEvent.name}
        initialEntries={entries}
      />
    </main>
  );
}

function ShiftScheduleFallback() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-xl border bg-muted/20 px-6 py-5" />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ShiftScheduleFallback />}>
      <ShiftScheduleContent />
    </Suspense>
  );
}
