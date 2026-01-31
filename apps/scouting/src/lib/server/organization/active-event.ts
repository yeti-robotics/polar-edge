import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { event, organizationEvent } from "@/lib/database/schema/tables";

export async function getActiveEventForOrganization(organizationId: string) {
  const row = await db.query.organizationEvent.findFirst({
    where: and(
      eq(organizationEvent.organizationId, organizationId),
      eq(organizationEvent.isActive, true)
    ),
    with: {
      event: true,
    },
  });

  return row ?? null;
}

export async function setActiveEventForOrganization(organizationId: string, eventId: string) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

  if (
    !activeMember ||
    activeMember.organizationId !== organizationId ||
    (activeMember.role !== "admin" && activeMember.role !== "owner")
  ) {
    throw new Error("Only admins and owners can set the active event");
  }

  const eventExists = await db.query.event.findFirst({
    where: eq(event.id, eventId),
  });

  if (!eventExists) {
    throw new Error("Event not found");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(organizationEvent)
      .set({ isActive: false })
      .where(
        and(
          eq(organizationEvent.organizationId, organizationId),
          eq(organizationEvent.isActive, true)
        )
      );

    await tx
      .insert(organizationEvent)
      .values({ organizationId, eventId, isActive: true })
      .onConflictDoUpdate({
        target: [organizationEvent.organizationId, organizationEvent.eventId],
        set: { isActive: true },
      });
  });
}

export async function listEvents() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return db
    .select({
      id: event.id,
      eventCode: event.eventCode,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
    })
    .from(event)
    .orderBy(desc(event.startDate));
}

/** Events linked to this organization (active + previous). */
export async function listOrganizationEvents(organizationId: string) {
  return db
    .select({
      id: event.id,
      eventCode: event.eventCode,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      isActive: organizationEvent.isActive,
    })
    .from(organizationEvent)
    .innerJoin(event, eq(event.id, organizationEvent.eventId))
    .where(eq(organizationEvent.organizationId, organizationId))
    .orderBy(desc(event.startDate));
}
