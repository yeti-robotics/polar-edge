import { Card, CardContent } from "@repo/ui/components/card";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { getMainEventOverviewRow } from "./actions";
import { EventOverviewTableClient } from "./EventOverviewTable";
import { EventSummaryCard } from "./EventSummaryCard";

export default async function EventOverviewPage() {
  const activeMember = await requireActiveMember();
  const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);

  if (!activeEvent?.event) {
    return (
      <div className="space-y-6">
        <div>
          <TypographyH1>Event Overview</TypographyH1>
          <TypographyMuted className="mt-1">
            Must first set an active event to view team rankings and reliability.
          </TypographyMuted>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No active event is set for your organization. You can configure one in here:{" "}
            <Link href={routes.admin.event} className="text-primary hover:underline">
              Admin → Active Event
            </Link>
            .
          </CardContent>
        </Card>
      </div>
    );
  }

  const rows = await getMainEventOverviewRow(activeEvent.event.id);

  return (
    <div className="space-y-6">
      <div>
        <TypographyH1>Event Overview</TypographyH1>
        <TypographyMuted className="mt-1"></TypographyMuted>
      </div>

      <EventSummaryCard rows={rows} />
      <EventOverviewTableClient rows={rows} />
    </div>
  );
}
