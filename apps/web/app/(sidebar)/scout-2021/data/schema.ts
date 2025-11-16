import { z } from "zod";
//This is the schema for the 2021 stand form
//Just defines the data fields that we need for this game

//The match identification schema which is mostly the same as the 2025 stand form
const matchDetailSchema = z.object({
	team_number: z.coerce
		.number({ message: "Team number must be a number" }) // whatever is in the parethesis is the error message
		.int({ message: "Team number cannot be blank" })
		.positive({ message: "Team number must be greater than zero" })
		.max(99999, { message: "Team number is too large" })
		.describe("Team number"),
	match_number: z.coerce
		.number({ message: "Match number must be a number" })
		.int({ message: "Match number cannot be blank" })
		.positive({ message: "Match number must be greater than zero" })
		.max(200, { message: "Match number is too large" })
		.describe("Match number"),
		//this is the schema for the match detail, basically the same as the 2025 stand form with the different fields we utilized (Most of it was done with autocomplete, thankfully, to prevent redundancy)
});

//This is the schema for auto
const autoSchema = z.object({
	// dropdown options for where teh robot started on the field
	auto_starting_position: z.enum(["front", "trench", "other"], { //has to be one of these exact options otherwise it will not matter
		message: "Starting position must be selected", //error message
	}).describe("Robot starting position"), //this is the description of the field
	
	// Power Cells scored in each goal (same as the 2025 stand form)
	auto_power_cells_inner: z.coerce
		.number()
		.int() //has to be an integer
		.nonnegative({ message: "Inner port power cells must be positive" }) //error message
		.describe("Power Cells in Inner Port (top goal)"), //description of the field
	
	auto_power_cells_outer: z.coerce 
		.number()
		.int()
		.nonnegative({ message: "Outer port power cells must be positive" })
		.describe("Power Cells in Outer Port (middle goal)"),
	
	auto_power_cells_lower: z.coerce
		.number()
		.int()
		.nonnegative({ message: "Lower port power cells must be positive" })
		.describe("Power Cells in Lower Port (bottom goal)"),
	
	// Movement and functionality aspects
	auto_left_initiation_line: z.coerce //.coerce is used to convert the value to a boolean, but it just converts to right type when it is used
		.boolean()
		.describe("Did robot cross initiation line?"),
	
	auto_worked: z.coerce
		.boolean()
		.describe("Did autonomous work correctly?"),
});

//This is the schema for teleop
const teleopSchema = z.object({
	// Power Cells scored (power cells here unlike coral before)
	teleop_power_cells_inner: z.coerce
		.number()
		.int()
		.nonnegative({ message: "Inner port power cells must be positive" })
		.describe("Power Cells in Inner Port"),
	
	teleop_power_cells_outer: z.coerce
		.number()
		.int()
		.nonnegative({ message: "Outer port power cells must be positive" })
		.describe("Power Cells in Outer Port"),
	
	teleop_power_cells_lower: z.coerce
		.number()
		.int()
		.nonnegative({ message: "Lower port power cells must be positive" })
		.describe("Power Cells in Lower Port"),
	
	// Intake capability basically the same thing as we had before
	teleop_intake: z.coerce
		.boolean()
		.describe("Can robot intake Power Cells?"),
	
	// as an extra scouting aspect 
	teleop_shooting_location: z.enum(["protected", "initiation", "trench", "close"], {
		message: "Shooting location must be selected",
	}).describe("Primary shooting location"),
	
	// Cycle speed (how fast robot scores)
	teleop_cycle_speed: z.enum(["fast", "medium", "slow"], {
		message: "Cycle speed must be selected",
	}).describe("Robot scoring cycle speed"),
	
	// Defense rating (literally the same thing as reefscape)
	teleop_defense_rating: z.enum(["bad", "average", "good"], {
		message: "Defense rating must be selected",
	}).describe("Robot defensive capability"),
});

//This is the schema for control panel (round thing that rotates!)
const controlPanelSchema = z.object({
	// Did they interact with control panel at all?
	control_panel_interact: z.coerce
		.boolean()
		.describe("Did robot interact with Control Panel?"),
	
	// Which stage did they complete?
	control_panel_stage: z.enum(["none", "rotation", "position"], {
		message: "Control panel stage must be selected",
	}).describe("Which stage completed?"),
	
	// Notes about control panel performance
	control_panel_notes: z.string().optional().describe("Control panel notes"),
});

//This is the schema for endgame (climb, park, balanced, etc)
const endgameSchema = z.object({
	// Climb attempts (basically the same thing as reefscape)
	endgame_attempted_climb: z.coerce
		.boolean()
		.describe("Did robot attempt to climb?"),
	
	endgame_successful_climb: z.coerce
		.boolean()
		.describe("Was climb successful?"), //was the robot able to climb based on user input here, comment type)
	
	// Whether or not the switch was balanced which is something we looked for
	endgame_switch_balanced: z.coerce
		.boolean()
		.describe("Was the switch balanced?"),
	
	// Comments about endgame performance (can be optional)
	endgame_comments: z.string().optional().describe("Endgame performance notes"),
});

//This is the schema for the miscellaneous observations
const miscSchema = z.object({
	final_comments: z
		.string({ message: "Comments must be at least 32 characters" })
		.min(32, { message: "Comments must be at least 32 characters" })
		.describe("Overall robot performance comments"),
});


//This helps create the standForm2021Data type
export const standForm2021Schema = z.object({
	match_detail: matchDetailSchema.describe("Match details"),
	auto: autoSchema.describe("Autonomous period"),
	teleop: teleopSchema.describe("Teleoperated period"),
	control_panel: controlPanelSchema.describe("Control Panel / Rotation Stage"),
	endgame: endgameSchema.describe("Endgame"),
	misc: miscSchema.describe("Miscellaneous"),
});

//This helps create the StageMetadata type
export type StageMetadata = {
	id: string;
	title: string;
	description: string;
	schema:
		| typeof matchDetailSchema
		| typeof autoSchema
		| typeof teleopSchema
		| typeof controlPanelSchema
		| typeof endgameSchema
		| typeof miscSchema;
};

//This is the form metadata for the 2021 stand form
export const formMetadata = {
	steps: [
		{
			id: "match_detail",
			title: "Match Details",
			description: "Enter match and team information",
			schema: matchDetailSchema,
		},
		{
			id: "auto",
			title: "Autonomous",
			description: "First 15 seconds - autonomous period",
			schema: autoSchema,
		},
		{
			id: "teleop",
			title: "Teleoperated",
			description: "2:15 driver-controlled period",
			schema: teleopSchema,
		},
		{
			id: "control_panel",
			title: "Control Panel",
			description: "Rotation / Position Control",
			schema: controlPanelSchema,
		},
		{
			id: "endgame",
			title: "Endgame",
			description: "Last 30 seconds - climbing",
			schema: endgameSchema,
		},
		{
			id: "misc",
			title: "Final Notes",
			description: "Overall performance comments",
			schema: miscSchema,
		},
	] satisfies StageMetadata[],
};

//Just to be able to export and use in actions folder
export type StandForm2021Data = z.infer<typeof standForm2021Schema>;

