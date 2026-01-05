import { EventSelector } from "./select-event";

import { db } from "@/lib/database";
import { tournament } from "@/lib/database/schema";
import { asc, desc } from "drizzle-orm";
export async function CurrentEvent() {
	const events = await db
		.select({
			id: tournament.id,
			name: tournament.eventName,
			isCurrent: tournament.isCurrent,
		})
		.from(tournament)
		.orderBy(desc(tournament.startDate), asc(tournament.eventName));

	return <EventSelector events={events} />;
}
