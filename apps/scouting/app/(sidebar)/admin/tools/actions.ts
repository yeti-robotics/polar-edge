"use server";

import { db } from "@/lib/database";
import { tournament } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const EventIdSchema = z.string().regex(/^\d{4}[a-zA-Z0-9]+$/);

export async function setCurrentEvent(eventId: string) {
	if (!EventIdSchema.safeParse(eventId).success) {
		throw new Error("Invalid event ID");
	}

	await db
		.update(tournament)
		.set({ isCurrent: false })
		.where(eq(tournament.isCurrent, true));
	await db
		.update(tournament)
		.set({ isCurrent: true })
		.where(eq(tournament.id, eventId));

	revalidatePath("/admin/tools");
}
