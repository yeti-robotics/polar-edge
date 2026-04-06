import { headers } from "next/headers";
import { ShiftSchedulePage } from "@/app/shift-schedule/components/ShiftSchedulePage";
import { NoActiveEvent } from "@/components/NoActiveEvent";
import { getShiftScheduleForActiveEvent } from "@/features/shift-schedule/queries";
import { buildStandMatchBlocks } from "@/features/shift-schedule/types";
import { auth } from "@/lib/auth";
import { requireActiveMember } from "@/lib/server/auth/require-member";

export default async function Page() {
  const activeMember = await requireActiveMember();
  const { activeEvent, entries, matchNumbers } = await getShiftScheduleForActiveEvent(
    activeMember.organizationId
  );

  if (!activeEvent) {
    return <NoActiveEvent />;
  }

  const membersResponse = await auth.api.listMembers({
    query: {
      organizationId: activeMember.organizationId,
      sortBy: "createdAt",
      sortDirection: "asc",
    },
    headers: await headers(),
  });

  const organizationMembers = (membersResponse?.members ?? []).map((member) => ({
    id: member.id,
    name: member.user.name,
    email: member.user.email,
    image: member.user.image ?? null,
    role: member.role,
  }));

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <ShiftSchedulePage
        activeMemberId={activeMember.id}
        eventName={activeEvent.name}
        initialEntries={entries}
        isAdmin={activeMember.role === "admin" || activeMember.role === "owner"}
        matchBlocks={buildStandMatchBlocks(matchNumbers)}
        organizationMembers={organizationMembers}
      />
    </main>
  );
}
