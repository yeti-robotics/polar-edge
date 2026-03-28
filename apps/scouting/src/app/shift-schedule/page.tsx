import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import { NoActiveEvent } from "@/components/NoActiveEvent";
import { getShiftScheduleForActiveEvent } from "@/features/shift-schedule/queries";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import ScoutingPage from "./components/ScoutingSchedule";

export default async function ScoutingSchedule() {
  const activeMember = await requireActiveMember();
  const isAdmin =
    activeMember.role === "admin" || activeMember.role === "owner";
  const { activeEvent, entries } = await getShiftScheduleForActiveEvent(
    activeMember.organizationId,
  );

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scouting Schedule</CardTitle>
          <TypographyMuted>
            View the current shift schedule for the active event.
          </TypographyMuted>
        </CardHeader>
        <CardContent>
          {!activeEvent ? (
            <NoActiveEvent />
          ) : (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Schedule details for {activeEvent.name} will appear below.
            </div>
          )}
        </CardContent>
      </Card>
      <ScoutingPage
        isAdmin={isAdmin}
        eventName={activeEvent?.name ?? null}
        initialEntries={entries}
      />
    </main>
  );
}
