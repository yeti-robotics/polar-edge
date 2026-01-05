import "server-only";
import { type RawCsvRow } from "./types";

import { Alliance } from "@/lib/database/schema";

/**
 * Generates a standard match ID for a match, in the same format used by The Blue Alliance
 *
 * This is primarily used for offseason events, where TBA may not have matches in their database for the event.
 *
 * @param eventCode - The event code, e.g. "2025ohio"
 * @param matchNumber - The match number, e.g. 1
 * @param compLevel - The competition level, e.g. "qm"
 * @param setNumber - The set number, e.g. 1
 * @returns The match ID, e.g. "2025ohio_qm1_1"
 */
export function generateMatchId(
	eventCode: string,
	matchNumber: number,
	compLevel = "qm",
	setNumber = 1
) {
	const matchId = `${eventCode}_${compLevel}${setNumber}_${matchNumber}`;
	if (matchId.length > 32) {
		throw new Error("Match ID is too long");
	}
	return matchId;
}

export function csvRowToDbRow(csvRow: RawCsvRow, eventCode: string) {
	const matchId = generateMatchId(eventCode, csvRow.matchNumber);

	const matchRecord = {
		id: matchId,
		compLevel: "qm",
		setNumber: 1,
		matchNumber: csvRow.matchNumber,
		eventKey: eventCode,
		winningAlliance: Alliance.EMPTY,
	};

	const blueTeamMatchRecords = csvRow.blue.map((teamNumber, index) => ({
		matchId: matchId,
		teamNumber: teamNumber,
		alliance: Alliance.BLUE,
		alliancePosition: index + 1,
	}));

	const redTeamMatchRecords = csvRow.red.map((teamNumber, index) => ({
		matchId: matchId,
		teamNumber: teamNumber,
		alliance: Alliance.RED,
		alliancePosition: index + 1,
	}));

	const teamRecords = [...new Set([...csvRow.blue, ...csvRow.red])].map(
		(teamNumber) => ({
			teamNumber,
			teamName: "",
		})
	);

	return {
		matchRecord,
		teamMatchRecords: [...blueTeamMatchRecords, ...redTeamMatchRecords],
		teamRecords,
	};
}
