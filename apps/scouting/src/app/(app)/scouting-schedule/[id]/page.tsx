import { redirect } from "next/navigation";
import { ScoutingScheduleBoard } from "@/features/scouting-schedule/components/ScoutingScheduleBoard";
import { getScoutingScheduleDetail } from "@/features/scouting-schedule/queries";
import { routes } from "@/lib/routes";
import { requireActiveMember } from "@/lib/server/auth/require-member";

interface ScoutingScheduleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScoutingScheduleDetailPage({
  params,
}: ScoutingScheduleDetailPageProps) {
  const { id } = await params;
  const activeMember = await requireActiveMember();
  const detail = await getScoutingScheduleDetail(id, activeMember.organizationId);

  if (!detail) {
    redirect(routes.scoutingSchedule.root);
  }

  const canEdit = activeMember.role === "admin" || activeMember.role === "owner";

  return <ScoutingScheduleBoard data={detail} canEdit={canEdit} />;
}
