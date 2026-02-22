import {
  getActiveEventForOrganization,
  listOrganizationEvents,
} from "@/lib/server/organization/active-event";
import { EmptyState } from "./EmptyState";
import { LeaderboardScopeToggle } from "./LeaderboardScopeToggle";
import { PodiumCard } from "./PodiumCard";
import { getStandFormCounts } from "../queries";
import { RankTable } from "./RankTable";

type Props = {
  organizationId: string;
  eventParam: string | null;
};

function resolveEffectiveEventId(
  eventParam: string | null,
  orgEvents: { id: string }[],
  activeEventId: string | null
): string | null {
  if (eventParam === "all") return null;
  if (eventParam) {
    const match = orgEvents.find((e) => e.id === eventParam);
    return match?.id ?? activeEventId ?? null;
  }
  return activeEventId ?? null;
}

export async function StandTabContent({ organizationId, eventParam }: Props) {
  const [orgEvents, activeOrgEvent] = await Promise.all([
    listOrganizationEvents(organizationId),
    getActiveEventForOrganization(organizationId),
  ]);

  const effectiveEventId = resolveEffectiveEventId(
    eventParam,
    orgEvents,
    activeOrgEvent?.eventId ?? null
  );

  const standCounts = await getStandFormCounts(organizationId, effectiveEventId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LeaderboardScopeToggle orgEvents={orgEvents} currentEventParam={eventParam ?? null} />
      </div>

      {standCounts.length === 0 ? (
        <EmptyState label="stand forms" />
      ) : (
        <>
          <div className="mx-auto max-w-sm">
            <PodiumCard scouts={standCounts.slice(0, 3)} countLabel="forms" />
          </div>
          <RankTable scouts={standCounts.slice(3)} startRank={4} />
        </>
      )}
    </div>
  );
}
