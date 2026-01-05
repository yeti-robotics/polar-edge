"use server";

import { _getTeamsInMatch, TeamInMatch } from "./teamsInMatch";
import { StandFormSubmissionErrors } from "./utils";
import { StandFormData, standFormSchema } from "../data/schema";

import {
	createServerAction,
	ServerActionError,
	ServerActionErrorWithCustomData,
} from "@/lib/actions/actions-utils";
import { auth } from "@/lib/auth";
import { AuthErrors, checkSession } from "@/lib/auth/utils";
import { db } from "@/lib/database";
import { standForm, UserRole } from "@/lib/database/schema";

/**
 * Insert a stand form into the database
 * @param userId The id of the user
 * @param matchId The id of the match
 * @param data The data to insert
 */
async function insertStandForm(
	userId: string,
	matchId: string,
	data: StandFormData
) {
	return db.insert(standForm).values({
		teamNumber: data.match_detail.team_number,
		matchId: matchId,
		leftBlackLine: data.auto.auto_initiation_line,
		userId: userId,
		autoCoralLevel1: data.auto.auto_coral_level_1,
		autoCoralLevel2: data.auto.auto_coral_level_2,
		autoCoralLevel3: data.auto.auto_coral_level_3,
		autoCoralLevel4: data.auto.auto_coral_level_4,
		autoAlgaeProcessor: data.auto.auto_algae_processed,
		autoAlgaeNet: data.auto.auto_algae_netted,
		teleopCoralLevel1: data.teleop.teleop_coral_level_1,
		teleopCoralLevel2: data.teleop.teleop_coral_level_2,
		teleopCoralLevel3: data.teleop.teleop_coral_level_3,
		teleopCoralLevel4: data.teleop.teleop_coral_level_4,
		teleopAlgaeProcessor: data.teleop.teleop_algae_processed,
		teleopAlgaeNet: data.teleop.teleop_algae_netted,
		cageClimb: data.endgame.cage_climb,
		comments: data.misc.comments,
		defenseRating: data.misc.defense_rating,
	});
}

/**
 * Submit a stand form
 *
 * Validates the user has access to submit a stand form for the given team and match.
 * Retrieves the current tournament, the team matches, and the match info.
 * If the team is not in the match, or the match info is not found, an error is thrown.
 *
 * Inserts the stand form into the database.
 *
 * @param data The data to submit
 */
async function _submitStandForm(data: StandFormData) {
	const session = await auth();

	if (!session) throw new ServerActionError(AuthErrors.UNAUTHORIZED);

	const { success, data: validatedData } = standFormSchema.safeParse(data);

	if (!success) {
		throw new ServerActionError("Invalid form data");
	}

	await checkSession(UserRole.USER, session);

	const teamMatches = await _getTeamsInMatch(data.match_detail.match_number);

	const teamMatchInfo = teamMatches.find(
		(t) => t.teamNumber === data.match_detail.team_number
	);

	if (!teamMatchInfo || !teamMatchInfo.matchId) {
		throw new ServerActionErrorWithCustomData(
			StandFormSubmissionErrors.TEAM_MATCH,
			teamMatches
		);
	}

	await insertStandForm(
		session.user.id,
		teamMatchInfo.matchId,
		validatedData
	).catch((err) => {
		console.error(err);
		throw new ServerActionError(StandFormSubmissionErrors.FAILURE);
	});
}

/**
 * Submit a stand form
 *
 * Validates the user has access to submit a stand form for the given team and match.
 * Retrieves the current tournament, the team matches, and the match info.
 * If the team is not in the match, or the match info is not found, an error is thrown.
 *
 * Inserts the stand form into the database.
 *
 * @param data The data to submit
 */
export const submitStandForm = createServerAction<
	void,
	TeamInMatch[],
	Parameters<typeof _submitStandForm>
>(_submitStandForm);
