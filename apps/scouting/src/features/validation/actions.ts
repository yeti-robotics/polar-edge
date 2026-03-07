"use server";

import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { member, standForm, teamMatch } from "@/lib/database/schema/tables";
import { requireAdminMember } from "@/lib/server/auth/require-member";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";

export async function deleteStandFormAction(formId: string): Promise<{ error?: string }> {
  const activeMember = await requireAdminMember();
  const { organizationId } = activeMember;

  const activeEvent = await getActiveEventForOrganization(organizationId);
  if (!activeEvent) return { error: "No active event" };

  // Verify the form belongs to this org
  const form = await db
    .select({ id: standForm.id, teamMatchId: standForm.teamMatchId })
    .from(standForm)
    .innerJoin(member, and(
      eq(member.id, standForm.scoutMemberId),
      eq(member.organizationId, organizationId)
    ))
    .where(eq(standForm.id, formId))
    .limit(1);

  if (!form[0]) return { error: "Form not found or unauthorized" };

  await db
    .update(standForm)
    .set({ deletedAt: new Date() })
    .where(eq(standForm.id, formId));

  const eventId = activeEvent.eventId;
  revalidateTag(cacheTags.teamMetrics(eventId), "max");
  revalidateTag(cacheTags.matchScores(eventId), "max");

  return {};
}
