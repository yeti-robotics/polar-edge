//All the fake match data and also teams for testing the form and being able to demonstrate its funcitoality
//Basically what the blue alliance would provide us. (I tried to replicate the schema we had for the 2025 stand form with the help of auto complete as well of course!)
export type MockTeam = {
	teamNumber: number;
	teamName: string;
	alliance: "red" | "blue";
	alliancePosition: number;
	matchId: string;
};

export type MockMatch = {
	matchId: string;
	matchNumber: number; //number of the match used in the match number field in the stand form
	teams: MockTeam[];
};

//fake team names for the teams in the matches (they are all real teams though)
const mockTeamNames: Record<number, string> = {
	1678: "Citrus Circuits",
	254: "The Cheesy Poofs",
	1323: "MadTown Robotics",
	118: "The Robonauts",
	2056: "OP Robotics",
	1114: "Simbotics",
	971: "Spartan Robotics",
	2910: "Jack in the Bot",
	3256: "WarriorBorgs",
	5940: "BREAD",
	//US US US US US US US US US US US US US US US
	3506: "Yeti Robotics",
};

//fake matches for the matches in the matches array (that we made in the previous function)
export function generateMockMatches(): MockMatch[] {
	const matches: MockMatch[] = []; //matches is an array of MockMatch types
	const teamNumbers = Object.keys(mockTeamNames).map(Number); //teamNumbers is an array of team numbers
	
	// Generate 20 qualification matches with this for loop
	for (let matchNum = 1; matchNum <= 20; matchNum++) { //adding a new match every time till it reaches 20
		const matchId = `2021_mock_qm${matchNum}`; //matchId is a string that says "2021_mock_qm" followed by the match number
		const teams: MockTeam[] = []; //teams is an array of MockTeam types
		
		// Shuffle teams to get random matchups (sort is a function that sorts the team numbers in a random order)
		const shuffled = [...teamNumbers].sort(() => Math.random() - 0.5);
		
		// Red alliance (3 teams)
		for (let i = 0; i < 3; i++) {
			const teamNumber = shuffled[i];
			if (teamNumber !== undefined) {
				teams.push({
					teamNumber,
					teamName: mockTeamNames[teamNumber] ?? "", //teamName is a string that says the team name from the mockTeamNames object
					alliance: "red",
					alliancePosition: i + 1,
					matchId,
				});
			}
		}
		
		// Blue alliance (3 teams)
		for (let i = 3; i < 6; i++) {
			const teamNumber = shuffled[i];
			if (teamNumber !== undefined) {
				teams.push({
					teamNumber,
					teamName: mockTeamNames[teamNumber] ?? "",
					alliance: "blue",
					alliancePosition: i - 2,
					matchId,
				});
			}
		}
		
		matches.push({
			matchId,
			matchNumber: matchNum,
			teams,
		});
	}
	
	return matches;
}


// fake data for the teams in a match used in teamsInMatch.ts and stored in the teams variable over there
export function getMockTeamsInMatch(matchNumber: number): MockTeam[] { //MockTeam is the type of the data that is being returned in an array
	const matches = generateMockMatches(); //generateMockMatches is a function that generates the mock matches (that we made in the previous function)
	const match = matches.find((m) => m.matchNumber === matchNumber); //find is a function that finds the match number in the matches array
	
	if (!match) {
		return []; //if the match is not found, return an empty array
	}
	
	return match.teams; //return the teams in the match
}

// fake data for the submissions used in submitForm.ts and stored in the submissions variable over there
export type MockSubmission = {
	id: string;
	userId: string;
	userName: string;
	matchNumber: number;
	teamNumber: number;
	submittedAt: Date;
	data: {
		auto: {
			starting_position: "front" | "trench" | "other"; //starting position of the robot in the autonomous period
			power_cells_inner: number; //number of power cells scored in the inner zone
			power_cells_outer: number; //number of power cells scored in the outer zone
			power_cells_lower: number; //number of power cells scored in the lower zone
			left_initiation_line: boolean; //whether or not the robot left the initiation line
			auto_worked: boolean; //whether or not the robot worked in the autonomous period
		};
		teleop: {
			power_cells_inner: number; //number of power cells scored in the inner zone
			power_cells_outer: number; //number of power cells scored in the outer zone
			power_cells_lower: number; //number of power cells scored in the lower zone
			intake: boolean; //whether or not the robot took power cells
			shooting_location: "protected" | "initiation" | "trench" | "close"; //location of the robot when shooting
			cycle_speed: "fast" | "medium" | "slow"; //speed of the robot when shooting
			defense_rating: "bad" | "average" | "good"; //rating of the robot's defense
		};
		control_panel: {
			interact: boolean; //whether or not the robot interacted with the control panel
			stage: "none" | "rotation" | "position";
			notes?: string; //notes about the control panel
		};
		endgame: {
			attempted_climb: boolean; //whether or not the robot attempted to climb
			successful_climb: boolean; //whether or not the robot successfully climbed
			switch_balanced: boolean; //whether or not the switch was balanced
			comments?: string; //comments about the endgame performance
		};
		misc: {
			final_comments: string; //comments about the overall performance
		};
	};
};

// fake data for the submissions used in submitForm.ts and stored in the submissions variable over there
export function generateMockSubmissions(): MockSubmission[] { //MockSubmission is the type of the data that is being returned in an array	
	const submissions: MockSubmission[] = []; //submissions is an array of MockSubmission types
	const teamNumbers = Object.keys(mockTeamNames).map(Number); //teamNumbers is an array of team numbers
	
	// Generate 3-5 submissions per team
	teamNumbers.forEach((teamNumber) => { //forEach is a function that iterates over the teamNumbers array
		const numSubmissions = Math.floor(Math.random() * 3) + 3; // 3-5 submissions
		
		for (let i = 0; i < numSubmissions; i++) {
			const matchNumber = Math.floor(Math.random() * 20) + 1; //matchNumber is a random number between 1 and 20
			
			const startingPositions = ["front", "trench", "other"] as const; //startingPositions is an array of starting positions
			const shootingLocations = ["protected", "initiation", "trench", "close"] as const;
			const cycleSpeeds = ["fast", "medium", "slow"] as const; //cycleSpeeds is an array of cycle speeds
			const defenseRatings = ["bad", "average", "good"] as const;
			const panelStages = ["none", "rotation", "position"] as const; //panelStages is an array of panel stages
			
			submissions.push({
				id: `sub_${teamNumber}_${matchNumber}_${i}`,
				userId: `user_${Math.floor(Math.random() * 10)}`, //userId is a random number between 0 and 10
				userName: `Scout ${Math.floor(Math.random() * 10)}`, //userName is a random number between 0 and 10
				matchNumber,
				teamNumber,
				submittedAt: new Date(2021, 2, Math.floor(Math.random() * 28) + 1), //submittedAt is a random date between January 1, 2021 and December 31, 2021
				data: {
					auto: {
						starting_position: startingPositions[Math.floor(Math.random() * 3)] as typeof startingPositions[number], //starting_position is a random starting position from the startingPositions array
						power_cells_inner: Math.floor(Math.random() * 4),
						power_cells_outer: Math.floor(Math.random() * 6), //power_cells_outer is a random number between 0 and 6
						power_cells_lower: Math.floor(Math.random() * 3), //power_cells_lower is a random number between 0 and 3
						left_initiation_line: Math.random() > 0.3, //left_initiation_line is a random number between 0 and 1
						auto_worked: Math.random() > 0.2, //auto_worked is a random number between 0 and 1
					},
					teleop: {
						power_cells_inner: Math.floor(Math.random() * 15), //power_cells_inner is a random number between 0 and 15
						power_cells_outer: Math.floor(Math.random() * 25), //power_cells_outer is a random number between 0 and 25
						power_cells_lower: Math.floor(Math.random() * 10), //power_cells_lower is a random number between 0 and 10
						intake: Math.random() > 0.3, //intake is a random number between 0 and 1
						shooting_location: shootingLocations[Math.floor(Math.random() * 4)] as typeof shootingLocations[number],
						cycle_speed: cycleSpeeds[Math.floor(Math.random() * 3)] as typeof cycleSpeeds[number], //cycle_speed is a random cycle speed from the cycleSpeeds array
						defense_rating: defenseRatings[Math.floor(Math.random() * 3)] as typeof defenseRatings[number], //defense_rating is a random defense rating from the defenseRatings array
					},
					control_panel: {
						interact: Math.random() > 0.5, //interact is a random number between 0 and 1
						stage: panelStages[Math.floor(Math.random() * 3)] as typeof panelStages[number],
						notes: "Control panel worked well", //notes is a string that says "Control panel worked well"
					},
					endgame: {
						attempted_climb: Math.random() > 0.3, //attempted_climb is a random number between 0 and 1
						successful_climb: Math.random() > 0.5, //successful_climb is a random number between 0 and 1			
						switch_balanced: Math.random() > 0.4, //switch_balanced is a random number between 0 and 1
						comments: "Good climb performance", //comments is a string that says "Good climb performance"
					},
					misc: {
						final_comments: "This is a great robot with excellent autonomous and strong teleop scoring capabilities. Defense was solid.", //final_comments is a string that says "This is a great robot with excellent autonomous and strong teleop scoring capabilities. Defense was solid."	
					},
				},
			});
		}
	});
	
	return submissions;
}

// fake data for the submissions for a specific team used in submitForm.ts and stored in the submissions variable over there
export function getMockSubmissionsForTeam(teamNumber: number): MockSubmission[] { //MockSubmission is the type of the data that is being returned in an array
	const allSubmissions = generateMockSubmissions(); //generateMockSubmissions is a function that generates the mock submissions (that we made in the previous function)
	return allSubmissions.filter((s) => s.teamNumber === teamNumber); //filter is a function that filters the submissions array by the team number
}

// fake data for the submissions for a specific match used in submitForm.ts and stored in the submissions variable over there
export function getMockSubmissionsForMatch(matchNumber: number): MockSubmission[] { //MockSubmission is the type of the data that is being returned in an array
	const allSubmissions = generateMockSubmissions(); //generateMockSubmissions is a function that generates the mock submissions (that we made in the previous function)
	return allSubmissions.filter((s) => s.matchNumber === matchNumber); //filter is a function that filters the submissions array by the match number
}

