"use server";
import { Match, MatchAlliance, MatchScoreBreakdown2025 } from "./schemas";

import { db } from "@/lib/database";
import {
	Alliance,
	match,
	matchScoreBreakdown,
	teamMatch,
} from "@/lib/database/schema";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
function getAllianceTeamMatches(
	alliance: MatchAlliance,
	matchId: string,
	allianceColor: Alliance
) {
	return alliance.team_keys.map((key, pos) => ({
		matchId: matchId,
		teamNumber: parseInt(key.slice(3)),
		alliance: allianceColor,
		alliancePosition: pos + 1,
	}));
}

function parseMatchScoreBreakdown(
	breakdown: MatchScoreBreakdown2025,
	matchId: string
) {
	const alliances = [Alliance.RED, Alliance.BLUE] as const;
	return alliances
		.map((alliance) => {
			const allianceBreakdown = breakdown[alliance];

			return {
				matchId: matchId,
				alliance: alliance,
				autoLineRobot1: allianceBreakdown.autoLineRobot1,
				autoLineRobot2: allianceBreakdown.autoLineRobot2,
				autoLineRobot3: allianceBreakdown.autoLineRobot3,
				autoMobilityPoints: allianceBreakdown.autoMobilityPoints,
				autoPoints: allianceBreakdown.autoPoints,
				autoReefTopRow: allianceBreakdown.autoReef.topRow,
				autoReefMidRow: allianceBreakdown.autoReef.midRow,
				autoReefBotRow: allianceBreakdown.autoReef.botRow,
				autoReefTrough: allianceBreakdown.autoReef.trough,
				bargeBonusAchieved: allianceBreakdown.bargeBonusAchieved,
				coopertitionCriteriaMet:
					allianceBreakdown.coopertitionCriteriaMet,
				coralBonusAchieved: allianceBreakdown.coralBonusAchieved,
				endGameBargePoints: allianceBreakdown.endGameBargePoints,
				endGameRobot1: allianceBreakdown.endGameRobot1,
				endGameRobot2: allianceBreakdown.endGameRobot2,
				endGameRobot3: allianceBreakdown.endGameRobot3,
				foulCount: allianceBreakdown.foulCount,
				foulPoints: allianceBreakdown.foulPoints,
				g206Penalty: allianceBreakdown.g206Penalty,
				g408Penalty: allianceBreakdown.g408Penalty,
				g424Penalty: allianceBreakdown.g424Penalty,
				netAlgaeCount: allianceBreakdown.netAlgaeCount,
				rp: allianceBreakdown.rp,
				techFoulCount: allianceBreakdown.techFoulCount,
				teleopCoralCount: allianceBreakdown.teleopCoralCount,
				teleopCoralPoints: allianceBreakdown.teleopCoralPoints,
				teleopPoints: allianceBreakdown.teleopPoints,
				teleopReefTopRow: allianceBreakdown.teleopReef.topRow,
				teleopReefMidRow: allianceBreakdown.teleopReef.midRow,
				teleopReefBotRow: allianceBreakdown.teleopReef.botRow,
				teleopReefTrough: allianceBreakdown.teleopReef.trough,
				totalPoints: allianceBreakdown.totalPoints,
				wallAlgaeCount: allianceBreakdown.wallAlgaeCount,
			};
		})
		.filter((breakdown) => breakdown !== null);
}

export async function seedMatches(eventKey: string) {
	// Validate eventKey
	const eventKeySchema = z
		.string()
		.regex(/^[a-zA-Z0-9_-]+$/, "Invalid event key format");
	const parsedEventKey = eventKeySchema.safeParse(eventKey);
	if (!parsedEventKey.success) {
		throw new Error("Invalid event key");
	}

	const matches = await fetch(
		`https://www.thebluealliance.com/api/v3/event/${parsedEventKey.data}/matches`,
		{
			headers: {
				"X-TBA-Auth-Key": process.env.TBA_API_KEY!,
			},
		}
	);

	const data = await matches.json();

	const parsedMatches = z.array(Match).safeParse(data);

	if (!parsedMatches.success) {
		console.dir(parsedMatches.error, { depth: null });
		throw new Error("Failed to parse matches");
	}

	for (const m of parsedMatches.data) {
		await db
			.insert(match)
			.values({
				id: m.key,
				compLevel: m.comp_level,
				setNumber: m.set_number,
				matchNumber: m.match_number,
				eventKey: m.event_key,
				winningAlliance: m.winning_alliance,
			})
			.onConflictDoUpdate({
				target: match.id,
				set: {
					winningAlliance: m.winning_alliance,
				},
			});

		const redTeamMatch = db
			.insert(teamMatch)
			.values(
				getAllianceTeamMatches(m.alliances.red, m.key, Alliance.RED)
			)
			.onConflictDoUpdate({
				target: [teamMatch.matchId, teamMatch.teamNumber],
				set: {
					alliance: Alliance.RED,
					alliancePosition: sql.raw(`excluded.alliance_position`),
				},
			});

		const blueTeamMatch = db
			.insert(teamMatch)
			.values(
				getAllianceTeamMatches(m.alliances.blue, m.key, Alliance.BLUE)
			)
			.onConflictDoUpdate({
				target: [teamMatch.matchId, teamMatch.teamNumber],
				set: {
					alliance: Alliance.BLUE,
					alliancePosition: sql.raw(`excluded.alliance_position`),
				},
			});

		await Promise.all([redTeamMatch, blueTeamMatch]);

		if (m.score_breakdown) {
			await db
				.insert(matchScoreBreakdown)
				.values(parseMatchScoreBreakdown(m.score_breakdown, m.key))
				.onConflictDoUpdate({
					target: [
						matchScoreBreakdown.matchId,
						matchScoreBreakdown.alliance,
					],
					set: {
						autoLineRobot1: sql.raw(`excluded.auto_line_robot1`),
						autoLineRobot2: sql.raw(`excluded.auto_line_robot2`),
						autoLineRobot3: sql.raw(`excluded.auto_line_robot3`),
						autoMobilityPoints: sql.raw(
							`excluded.auto_mobility_points`
						),
						autoPoints: sql.raw(`excluded.auto_points`),
						autoReefTopRow: sql.raw(`excluded.auto_reef_top_row`),
						autoReefMidRow: sql.raw(`excluded.auto_reef_mid_row`),
						autoReefBotRow: sql.raw(`excluded.auto_reef_bot_row`),
						autoReefTrough: sql.raw(`excluded.auto_reef_trough`),
						bargeBonusAchieved: sql.raw(
							`excluded.barge_bonus_achieved`
						),
						coopertitionCriteriaMet: sql.raw(
							`excluded.coopertition_criteria_met`
						),
						coralBonusAchieved: sql.raw(
							`excluded.coral_bonus_achieved`
						),
						endGameBargePoints: sql.raw(
							`excluded.end_game_barge_points`
						),
						endGameRobot1: sql.raw(`excluded.end_game_robot1`),
						endGameRobot2: sql.raw(`excluded.end_game_robot2`),
						endGameRobot3: sql.raw(`excluded.end_game_robot3`),
						foulCount: sql.raw(`excluded.foul_count`),
						foulPoints: sql.raw(`excluded.foul_points`),
						g206Penalty: sql.raw(`excluded.g206_penalty`),
						g408Penalty: sql.raw(`excluded.g408_penalty`),
						g424Penalty: sql.raw(`excluded.g424_penalty`),
						netAlgaeCount: sql.raw(`excluded.net_algae_count`),
						rp: sql.raw(`excluded.rp`),
						techFoulCount: sql.raw(`excluded.tech_foul_count`),
						teleopCoralCount: sql.raw(
							`excluded.teleop_coral_count`
						),
						teleopCoralPoints: sql.raw(
							`excluded.teleop_coral_points`
						),
						teleopPoints: sql.raw(`excluded.teleop_points`),
						teleopReefTopRow: sql.raw(
							`excluded.teleop_reef_top_row`
						),
						teleopReefMidRow: sql.raw(
							`excluded.teleop_reef_mid_row`
						),
						teleopReefBotRow: sql.raw(
							`excluded.teleop_reef_bot_row`
						),
						teleopReefTrough: sql.raw(
							`excluded.teleop_reef_trough`
						),
						totalPoints: sql.raw(`excluded.total_points`),
						wallAlgaeCount: sql.raw(`excluded.wall_algae_count`),
					},
				});
		}
	}

	revalidatePath("/admin/tools");
}
