"use server";

import { getMockTeamsInMatch } from "../data/mockData";
//helper function to get the teams in a match
export type TeamInMatch = { //type turns it into a typescript type, literally like a string or something else
	teamNumber: number
	teamName: string; //name of the team
	alliance: "red" | "blue"; //alliance of the team
	alliancePosition: number; //position of the team in the alliance
	matchId: string; //id of the match
};

export async function getTeamsInMatch(matchNumber: number): Promise<{success: boolean; value?: TeamInMatch[]; error?: string;}> {
	try {
		// to feel like we are actually getting the data from the server like from a real API
		// This is just to simulate a network delay for the user to see that it is loading (Just for demo purposes) (Done by AutoComplete!)
		await new Promise((resolve) => setTimeout(resolve, 500)); //wait for 500ms
		const teams = getMockTeamsInMatch(matchNumber);
		
		if (teams.length === 0) {
			return {
				success: false,
				error: "No teams found for this match", // since there is 0 teams in the array
			};
		}
		
		return {
			success: true,
			value: teams,
		};
	} catch (error) {
		console.error("Error fetching teams:", error);
		return {
			success: false,
			error: "Failed to fetch teams",
		};
	}
}

//the try and catch is redunant since it is just a fall back in the case there is an error, here there really is not



