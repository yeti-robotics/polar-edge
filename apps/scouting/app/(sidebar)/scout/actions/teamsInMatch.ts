"use server";

import { createServerAction } from "@/lib/actions/actions-utils";
import { db } from "@/lib/database";
import { match, team, teamMatch, tournament } from "@/lib/database/schema";
import { and, eq } from "drizzle-orm";

export type TeamInMatch = {
	matchId: string | null;
	teamNumber: number;
	alliance: string;
	alliancePosition: number;
	teamName: string | null;
};

/**
 * Get information about teams in a match
 * @param matchNumber The match number to get the teams for
 * @returns An array of objects with the following properties:
 * - matchId: The id of the match
 * - teamNumber: The number of the team
 */
export async function _getTeamsInMatch(
	matchNumber: number
): Promise<TeamInMatch[]> {
	return db
		.select({
			matchId: match.id,
			teamNumber: teamMatch.teamNumber,
			alliance: teamMatch.alliance,
			alliancePosition: teamMatch.alliancePosition,
			teamName: team.teamName,
		})
		.from(teamMatch)
		.leftJoin(
			match,
			and(eq(teamMatch.matchId, match.id), eq(match.compLevel, "qm"))
		)
		.leftJoin(tournament, eq(match.eventKey, tournament.id))
		.leftJoin(team, eq(teamMatch.teamNumber, team.teamNumber))
		.where(
			and(
				eq(tournament.isCurrent, true),
				eq(
					match.matchNumber,
					matchNumber < 0 || isNaN(matchNumber) ? 0 : matchNumber
				)
			)
		);
}

/**
 * Get information about teams in a match
 * @param matchNumber The match number to get the teams for
 * @returns An array of objects with the following properties:
 * - matchId: The id of the match
 * - teamNumber: The number of the team
 */
export const getTeamsInMatch = createServerAction(_getTeamsInMatch);
