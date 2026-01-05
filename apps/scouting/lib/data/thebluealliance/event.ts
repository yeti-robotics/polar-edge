"use server";

import { EventSimple, TeamSimple } from "./schemas";

import { db } from "@/lib/database";
import { team, tournament } from "@/lib/database/schema";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function parseEvent(event: z.infer<typeof EventSimple>) {
	return {
		id: event.key,
		eventName: event.name,
		startDate: event.start_date,
		endDate: event.end_date,
	};
}

export async function seedEvent(eventForm: FormData) {
	const eventKey = eventForm.get("eventKey");

	if (!eventKey) {
		throw new Error("Event key is required");
	}

	const event = await fetch(
		`https://www.thebluealliance.com/api/v3/event/${eventKey}/simple`,
		{
			headers: {
				"X-TBA-Auth-Key": process.env.TBA_API_KEY!,
			},
		}
	).then((res) => res.json());

	const eventParsed = EventSimple.safeParse(event);

	if (eventParsed.success) {
		const eventData = parseEvent(eventParsed.data);
		await db
			.insert(tournament)
			.values({
				id: eventData.id,
				eventName: eventData.eventName,
				startDate: eventData.startDate,
				endDate: eventData.endDate,
			})
			.onConflictDoUpdate({
				target: [tournament.id],
				set: eventData,
			});
	}

	const teams = await fetch(
		`https://www.thebluealliance.com/api/v3/event/${eventKey}/teams/simple`,
		{
			headers: {
				"X-TBA-Auth-Key": process.env.TBA_API_KEY!,
			},
		}
	).then((res) => res.json());

	const teamsParsed = z.array(TeamSimple).safeParse(teams);

	if (teamsParsed.success) {
		const teamsData = teamsParsed.data.map((team) => ({
			teamNumber: team.team_number,
			teamName: team.nickname,
		}));

		await db
			.insert(team)
			.values(teamsData)
			.onConflictDoUpdate({
				target: [team.teamNumber],
				set: {
					teamName: sql.raw(`excluded.team_name`),
				},
			});
	} else {
		console.dir(teamsParsed.error, { depth: null });
	}

	revalidatePath("/admin/tools");
}
