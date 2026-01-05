"use server";

import {
	createServerAction,
	ServerActionError,
} from "@/lib/actions/actions-utils";
import { db } from "@/lib/database";
import { team, tournament, match, teamMatch } from "@/lib/database/schema";
import { asc, desc, sql, ilike, or, and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type SortDir = "asc" | "desc";

interface FetchTeamsParams {
	page: number;
	pageSize: number;
	sortBy: "teamNumber" | "teamName";
	sortDirection: SortDir;
	search?: string;
	eventId?: string;
}

export const fetchEvents = createServerAction(async () => {
	return db
		.select({
			id: tournament.id,
			name: tournament.eventName,
			isCurrent: tournament.isCurrent,
		})
		.from(tournament)
		.orderBy(desc(tournament.startDate));
});

export const fetchTeams = createServerAction(
	async ({
		page = 1,
		pageSize = 10,
		sortBy = "teamNumber",
		sortDirection = "asc",
		search = "",
		eventId,
	}: FetchTeamsParams) => {
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (search) {
			conditions.push(
				or(
					ilike(team.teamName, `%${search}%`),
					ilike(sql`CAST(${team.teamNumber} AS TEXT)`, `%${search}%`)
				)
			);
		}

		let query;
		if (eventId && eventId !== "all") {
			// Get teams in the event
			query = db
				.selectDistinct({
					teamNumber: team.teamNumber,
					teamName: team.teamName,
				})
				.from(team)
				.innerJoin(teamMatch, eq(team.teamNumber, teamMatch.teamNumber))
				.innerJoin(match, eq(teamMatch.matchId, match.id))
				.where(and(eq(match.eventKey, eventId), ...conditions));
		} else {
			// Get all teams
			query = db
				.select({
					teamNumber: team.teamNumber,
					teamName: team.teamName,
				})
				.from(team)
				.where(and(...conditions));
		}

		const teams = await query
			.orderBy(
				sortDirection === "asc" ? asc(team[sortBy]) : desc(team[sortBy])
			)
			.limit(pageSize)
			.offset(offset);

		// Count query
		let countQuery;
		if (eventId && eventId !== "all") {
			countQuery = db
				.select({
					count: sql<number>`count(distinct ${team.teamNumber})`,
				})
				.from(team)
				.innerJoin(teamMatch, eq(team.teamNumber, teamMatch.teamNumber))
				.innerJoin(match, eq(teamMatch.matchId, match.id))
				.where(and(eq(match.eventKey, eventId), ...conditions));
		} else {
			countQuery = db
				.select({
					count: sql<number>`count(*)`,
				})
				.from(team)
				.where(and(...conditions));
		}

		const totalCount = await countQuery.then((res) =>
			Number(res[0]?.count ?? 0)
		);

		return {
			teams,
			totalPages: Math.ceil(totalCount / pageSize),
			currentPage: page,
		};
	}
);

export const addTeamFromTBA = createServerAction(async (teamNumber: number) => {
	// Check if team already exists
	const existingTeam = await db
		.select()
		.from(team)
		.where(sql`${team.teamNumber} = ${teamNumber}`)
		.limit(1);

	if (existingTeam.length > 0) {
		throw new ServerActionError("Team already exists");
	}

	// Fetch team from TBA
	const response = await fetch(
		`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}`,
		{
			headers: {
				"X-TBA-Auth-Key": process.env.TBA_API_KEY || "",
			},
		}
	);

	if (!response.ok) {
		throw new ServerActionError("Team not found on The Blue Alliance");
	}

	const tbaTeam = await response.json();

	// Insert team into database
	await db.insert(team).values({
		teamNumber: teamNumber,
		teamName: tbaTeam.nickname || `Team ${teamNumber}`,
	});

	revalidatePath("/admin/teams");

	return {
		team: {
			teamNumber,
			teamName: tbaTeam.nickname || `Team ${teamNumber}`,
		},
	};
});
