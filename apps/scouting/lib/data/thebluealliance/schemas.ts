import { Alliance, Cage } from "@/lib/database/schema";
import { z } from "zod";

const EndGameState2025 = z.enum([
	Cage.NONE,
	Cage.PARK,
	Cage.SHALLOW,
	Cage.DEEP,
]);

function getReefBreakdown2025RowCount(row: ReefBreakdown2025Row) {
	return Object.values(row).filter(Boolean).length;
}

const ReefBreakdown2025Row = z.object({
	nodeA: z.boolean(),
	nodeB: z.boolean(),
	nodeC: z.boolean(),
	nodeD: z.boolean(),
	nodeE: z.boolean(),
	nodeF: z.boolean(),
	nodeG: z.boolean(),
	nodeH: z.boolean(),
	nodeI: z.boolean(),
	nodeJ: z.boolean(),
	nodeK: z.boolean(),
	nodeL: z.boolean(),
});

const ReefBreakdown2025 = z.object({
	topRow: ReefBreakdown2025Row,
	midRow: ReefBreakdown2025Row,
	botRow: ReefBreakdown2025Row,
	trough: z.number(),
});

const MatchScoreBreakdown2025Alliance = z.object({
	adjustPoints: z.number(),
	algaePoints: z.number(),
	autoBonusAchieved: z.boolean(),
	autoCoralCount: z.number(),
	autoCoralPoints: z.number(),
	autoLineRobot1: z.enum(["No", "Yes"]).transform((val) => val === "Yes"),
	autoLineRobot2: z.enum(["No", "Yes"]).transform((val) => val === "Yes"),
	autoLineRobot3: z.enum(["No", "Yes"]).transform((val) => val === "Yes"),
	autoMobilityPoints: z.number(),
	autoPoints: z.number(),
	autoReef: ReefBreakdown2025.transform((val) => ({
		topRow: getReefBreakdown2025RowCount(val.topRow),
		midRow: getReefBreakdown2025RowCount(val.midRow),
		botRow: getReefBreakdown2025RowCount(val.botRow),
		trough: val.trough,
	})),
	bargeBonusAchieved: z.boolean(),
	coopertitionCriteriaMet: z.boolean(),
	coralBonusAchieved: z.boolean(),
	endGameBargePoints: z.number(),
	endGameRobot1: EndGameState2025,
	endGameRobot2: EndGameState2025,
	endGameRobot3: EndGameState2025,
	foulCount: z.number(),
	foulPoints: z.number(),
	g206Penalty: z.boolean().default(false),
	g408Penalty: z.boolean().default(false),
	g424Penalty: z.boolean().default(false),
	netAlgaeCount: z.number(),
	rp: z.number(),
	techFoulCount: z.number(),
	teleopCoralCount: z.number(),
	teleopCoralPoints: z.number(),
	teleopPoints: z.number(),
	totalPoints: z.number(),
	teleopReef: ReefBreakdown2025.transform((val) => ({
		topRow: getReefBreakdown2025RowCount(val.topRow),
		midRow: getReefBreakdown2025RowCount(val.midRow),
		botRow: getReefBreakdown2025RowCount(val.botRow),
		trough: val.trough,
	})),
	wallAlgaeCount: z.number(),
});

const MatchScoreBreakdown2025 = z.object({
	blue: MatchScoreBreakdown2025Alliance,
	red: MatchScoreBreakdown2025Alliance,
});

const MatchAlliance = z.object({
	score: z.number(),
	team_keys: z.array(z.string()),
	surrogate_team_keys: z.array(z.string()),
	dq_team_keys: z.array(z.string()),
});

const MatchVideo = z.object({
	key: z.string(),
	type: z.enum(["youtube", "tba"]),
});

const Match = z.object({
	key: z.string(),
	comp_level: z.enum(["qm", "ef", "qf", "sf", "f"]),
	set_number: z.number(),
	match_number: z.number(),
	alliances: z.object({
		red: MatchAlliance,
		blue: MatchAlliance,
	}),
	winning_alliance: z.enum([Alliance.RED, Alliance.BLUE, Alliance.EMPTY]), // "" if tie
	event_key: z.string(),
	time: z.number().nullable(),
	actual_time: z.number().nullable(),
	predicted_time: z.number().nullable(),
	post_result_time: z.number().nullable(),
	score_breakdown: MatchScoreBreakdown2025.nullable(),
	videos: z.array(MatchVideo),
});

const EventSimple = z.object({
	key: z.string(),
	name: z.string(),
	event_code: z.string(),
	event_type: z.number(),
	district: z
		.object({
			abbreviation: z.string(),
			display_name: z.string(),
			key: z.string(),
			year: z.number(),
		})
		.nullable(),
	city: z.string(),
	state_prov: z.string(),
	country: z.string(),
	start_date: z.string(),
	end_date: z.string(),
	year: z.number(),
});

const TeamSimple = z.object({
	key: z.string(),
	team_number: z.number(),
	nickname: z.string(),
	name: z.string(),
	city: z.string(),
	state_prov: z.string(),
	country: z.string(),
});

export {
	Match,
	EventSimple,
	TeamSimple,
	MatchScoreBreakdown2025,
	MatchScoreBreakdown2025Alliance,
	ReefBreakdown2025,
	ReefBreakdown2025Row,
	EndGameState2025,
};

export type Match = z.infer<typeof Match>;
export type MatchAlliance = z.infer<typeof MatchAlliance>;
export type MatchScoreBreakdown2025 = z.infer<typeof MatchScoreBreakdown2025>;
export type MatchScoreBreakdown2025Alliance = z.infer<
	typeof MatchScoreBreakdown2025Alliance
>;
export type ReefBreakdown2025 = z.infer<typeof ReefBreakdown2025>;
export type ReefBreakdown2025Row = z.infer<typeof ReefBreakdown2025Row>;
export type EndGameState2025 = z.infer<typeof EndGameState2025>;
