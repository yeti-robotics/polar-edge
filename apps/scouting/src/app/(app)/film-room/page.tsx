import { Suspense } from "react";
import { FilmRoomPicker } from "@/features/film-room/components/FilmRoomPicker";
import { getQualMatchOptions } from "@/features/film-room/queries";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";

async function FilmRoomPickerContent() {
  const member = await requireActiveMember();
  const activeEvent = await getActiveEventForOrganization(member.organizationId);

  // No active event: links and uploads still work, there's just no qual list.
  const matchOptions = activeEvent?.event
    ? await getQualMatchOptions(
        member.organizationId,
        activeEvent.event.id,
        activeEvent.event.eventCode
      )
    : [];

  return <FilmRoomPicker matchOptions={matchOptions} />;
}

export default function FilmRoomPage() {
  return (
    <Suspense fallback={<div className="size-full bg-black" />}>
      <FilmRoomPickerContent />
    </Suspense>
  );
}
