import { createServerAction } from "@/lib/actions/actions-utils";
import { db } from "@/lib/database";
import { tournament } from "@/lib/database/schema";

export const getAllTournaments = createServerAction(async () => {
	return db
		.select({
			id: tournament.id,
			name: tournament.eventName,
			isCurrent: tournament.isCurrent,
			startDate: tournament.startDate,
		})
		.from(tournament);
});

export type TournamentData = Extract<
	Awaited<ReturnType<typeof getAllTournaments>>,
	{ value: unknown }
>["value"];
