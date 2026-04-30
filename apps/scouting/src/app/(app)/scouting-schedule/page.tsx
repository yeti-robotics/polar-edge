import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyH4, TypographyMuted } from "@repo/ui/components/typography";
import { CalendarDaysIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CreateScoutingScheduleDialog } from "@/features/scouting-schedule/components/CreateScoutingScheduleDialog";
import { formatScheduleDateRange } from "@/features/scouting-schedule/logic";
import { getScoutingSchedulesForOrganization } from "@/features/scouting-schedule/queries";
import { routes } from "@/lib/routes";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization, listOrganizationEvents } from "@/lib/server/organization/active-event";

function LoadingSchedules() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="mt-2 h-4 w-64" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

async function ScoutingScheduleContent() {
  const activeMember = await requireActiveMember();
  const canEdit = activeMember.role === "admin" || activeMember.role === "owner";

  const [schedules, activeEvent, organizationEvents] = await Promise.all([
    getScoutingSchedulesForOrganization(activeMember.organizationId),
    getActiveEventForOrganization(activeMember.organizationId),
    canEdit ? listOrganizationEvents(activeMember.organizationId) : Promise.resolve([]),
  ]);

  const openSchedules = schedules.filter((schedule) => schedule.isOpen);
  const closedSchedules = schedules.filter((schedule) => !schedule.isOpen);

  const createButton =
    canEdit && organizationEvents.length > 0 ? (
      <CreateScoutingScheduleDialog
        events={organizationEvents}
        defaultEventId={activeEvent?.eventId ?? organizationEvents[0]?.id ?? null}
      >
        <Button>
          <PlusIcon className="size-4" />
          Create schedule
        </Button>
      </CreateScoutingScheduleDialog>
    ) : null;

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-dashed text-muted-foreground">
            <CalendarDaysIcon className="size-5" />
          </div>
          <div className="space-y-2">
            <p className="font-medium">No scouting schedules yet.</p>
            <p className="max-w-xl text-sm text-muted-foreground">
              {canEdit
                ? organizationEvents.length > 0
                  ? "Create a schedule for one of your events and start assigning scouts to qualification matches."
                  : "Sync or activate an event first, then come back here to create a scouting schedule."
                : "Ask an admin to create a schedule for the current event."}
            </p>
          </div>
          {createButton}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <TypographyH4>Open schedules</TypographyH4>
            <TypographyMuted>
              Current schedules your scouts can open and reference.
            </TypographyMuted>
          </div>
          {createButton}
        </div>

        <div className="flex flex-col gap-4">
          {openSchedules.map((schedule) => (
            <Link key={schedule.id} href={routes.scoutingSchedule.detail(schedule.id)}>
              <Card className="cursor-pointer border-border/70 transition-colors hover:border-primary">
                <CardHeader className="gap-3">
                  <CardTitle className="text-2xl">{schedule.name}</CardTitle>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{schedule.eventName}</p>
                    <p>
                      {formatScheduleDateRange(schedule.startDate, schedule.endDate)} •{" "}
                      {schedule.matchCount} qualification{" "}
                      {schedule.matchCount === 1 ? "match" : "matches"} to scout
                    </p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {closedSchedules.length > 0 && (
        <section className="space-y-4">
          <div>
            <TypographyH4>Closed schedules</TypographyH4>
            <TypographyMuted>
              Previous schedules that are still available for reference.
            </TypographyMuted>
          </div>
          <div className="flex flex-col gap-4">
            {closedSchedules.map((schedule) => (
              <Link key={schedule.id} href={routes.scoutingSchedule.detail(schedule.id)}>
                <Card className="cursor-pointer border-border/60 transition-colors hover:border-primary">
                  <CardHeader className="gap-3">
                    <CardTitle className="text-xl">{schedule.name}</CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{schedule.eventName}</p>
                      <p>
                        {formatScheduleDateRange(schedule.startDate, schedule.endDate)} •{" "}
                        {schedule.matchCount} qualification{" "}
                        {schedule.matchCount === 1 ? "match" : "matches"} to scout
                      </p>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ScoutingSchedulePage() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <TypographyH1>Scouting Schedule</TypographyH1>
        <TypographyMuted>
          Organize match coverage by event, assign scouts, and keep the weekend plan in one place.
        </TypographyMuted>
      </div>

      <Suspense fallback={<LoadingSchedules />}>
        <ScoutingScheduleContent />
      </Suspense>
    </main>
  );
}
