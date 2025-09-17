import { MatchScoreBreakdown2024Schema } from "./match-breakdowns/crescendo-2024";
import { MatchScoreBreakdown2025Schema } from "./match-breakdowns/reefscape-2025";

import { z } from "zod";

export enum Alliance {
	RED = "red",
	BLUE = "blue",
	EMPTY = "",
}

const MatchAllianceSchema = z.object({
	score: z.number(),
	team_keys: z.array(z.string()),
	surrogate_team_keys: z.array(z.string()),
	dq_team_keys: z.array(z.string()),
});

const MatchVideoSchema = z.object({
	key: z.string(),
	type: z.enum(["youtube", "tba"]),
});

const BaseMatchSchema = z.object({
	key: z.string(),
	comp_level: z.enum(["qm", "ef", "qf", "sf", "f"]),
	set_number: z.number(),
	match_number: z.number(),
	alliances: z.object({
		red: MatchAllianceSchema,
		blue: MatchAllianceSchema,
	}),
	winning_alliance: z.enum([Alliance.RED, Alliance.BLUE, Alliance.EMPTY]),
	event_key: z.string(),
	time: z.number().nullable(),
	actual_time: z.number().nullable(),
	predicted_time: z.number().nullable(),
	post_result_time: z.number().nullable(),
	videos: z.array(MatchVideoSchema),
});

// Year-specific schemas
const Match2025Schema = BaseMatchSchema.extend({
	year: z.literal(2025),
	score_breakdown: MatchScoreBreakdown2025Schema.nullable(),
});

const Match2024Schema = BaseMatchSchema.extend({
	year: z.literal(2024),
	score_breakdown: MatchScoreBreakdown2024Schema.nullable(),
});

const MatchSchema = z.discriminatedUnion("year", [
	Match2025Schema,
	Match2024Schema,
	// Add more year schemas here as they are created
]);

export type Match = z.infer<typeof MatchSchema>;
export { MatchSchema };
