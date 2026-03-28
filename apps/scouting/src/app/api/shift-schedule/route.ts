import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ShiftSchedulePayloadSchema } from "@/features/shift-schedule/types";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { shiftSchedule } from "@/lib/database/schema";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeMember = await auth.api.getActiveMember({ headers: await headers() });
  if (!activeMember) {
    return NextResponse.json({ error: "No active organization" }, { status: 403 });
  }

  const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);
  if (!activeEvent?.event) {
    return NextResponse.json({ error: "No active event" }, { status: 400 });
  }

  const schedule = await db.query.shiftSchedule
    .findFirst({
      where: and(
        eq(shiftSchedule.organizationId, activeMember.organizationId),
        eq(shiftSchedule.eventId, activeEvent.event.id)
      ),
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "";
      const causeMessage =
        error && typeof error === "object" && "cause" in error && error.cause instanceof Error
          ? error.cause.message
          : "";
      if (
        message.includes('relation "shift_schedule" does not exist') ||
        causeMessage.includes('relation "shift_schedule" does not exist')
      ) {
        return null;
      }
      throw error;
    });

  const scheduleData = schedule?.scheduleData as { entries?: unknown[] } | null;

  return NextResponse.json({
    entries: Array.isArray(scheduleData?.entries) ? scheduleData?.entries : [],
    eventId: activeEvent.event.id,
    eventName: activeEvent.event.name,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeMember = await auth.api.getActiveMember({ headers: await headers() });
  if (!activeMember) {
    return NextResponse.json({ error: "No active organization" }, { status: 403 });
  }

  const isAdmin = activeMember.role === "admin" || activeMember.role === "owner";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);
  if (!activeEvent?.event) {
    return NextResponse.json({ error: "No active event" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ShiftSchedulePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = parsed.data;

  await db
    .insert(shiftSchedule)
    .values({
      organizationId: activeMember.organizationId,
      eventId: activeEvent.event.id,
      scheduleData: payload,
    })
    .onConflictDoUpdate({
      target: [shiftSchedule.organizationId, shiftSchedule.eventId],
      set: {
        scheduleData: payload,
        updatedAt: new Date(),
      },
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "";
      const causeMessage =
        error && typeof error === "object" && "cause" in error && error.cause instanceof Error
          ? error.cause.message
          : "";
      if (
        message.includes('relation "shift_schedule" does not exist') ||
        causeMessage.includes('relation "shift_schedule" does not exist')
      ) {
        throw new Error("Schedule storage is not initialized. Run migrations.");
      }
      throw error;
    });

  return NextResponse.json({
    entries: payload.entries,
    eventId: activeEvent.event.id,
    eventName: activeEvent.event.name,
  });
}
