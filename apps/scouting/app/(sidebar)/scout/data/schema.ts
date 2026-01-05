import { Cage } from "@/lib/database/schema";
import { z } from "zod";

const cageEnum = z.nativeEnum(Cage);

/**
 * Generate a Zod schema for the coral data, given the period of the match and row
 * @param period - The period of the data
 * @param level - The level of the data
 * @returns A schema for the coral data
 */
function generateCoralSchema(
	period: "auto" | "teleop",
	row: "trough" | "low" | "mid" | "high"
) {
	const messagePrefix = `Coral in ${period} period, ${row} row`;
	return z.coerce
		.number({ message: `${messagePrefix} must be a number` })
		.int({ message: `${messagePrefix} must be an integer` })
		.nonnegative({
			message: `${messagePrefix} must be positive`,
		})
		.describe(messagePrefix);
}

/**
 * Schema for the match details
 */
const matchDetailSchema = z.object({
	team_number: z.coerce
		.number({ message: "Team number must be a number" })
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
});

/**
 * Schema for the autonomous period
 */
const autoSchema = z.object({
	auto_initiation_line: z.coerce.boolean().describe("Crossed black line?"),
	auto_coral_level_1: generateCoralSchema("auto", "trough"),
	auto_coral_level_2: generateCoralSchema("auto", "low"),
	auto_coral_level_3: generateCoralSchema("auto", "mid"),
	auto_coral_level_4: generateCoralSchema("auto", "high"),
	auto_algae_processed: z.coerce
		.number()
		.int()
		.nonnegative({
			message: "Auto Algae Processed must be positive",
		})

		.describe("Algae in processor"),
	auto_algae_netted: z.coerce
		.number()
		.int()
		.nonnegative({ message: "Auto Algae Netted must be positive" })

		.describe("Algae netted by a robot"),
});

/**
 * Schema for the teleop period
 */
const teleopSchema = z.object({
	teleop_coral_level_1: generateCoralSchema("teleop", "trough"),
	teleop_coral_level_2: generateCoralSchema("teleop", "low"),
	teleop_coral_level_3: generateCoralSchema("teleop", "mid"),
	teleop_coral_level_4: generateCoralSchema("teleop", "high"),
	teleop_algae_processed: z.coerce
		.number()
		.int()
		.nonnegative({
			message: "Teleop Algae Processed must be positive",
		})

		.describe("Algae processed"),
	teleop_algae_netted: z.coerce
		.number()
		.int()
		.nonnegative({
			message: "Teleop Algae Netted must be positive",
		})

		.describe("Algae netted by a robot"),
});

/**
 * Schema for the endgame "period"
 */
const endgameSchema = z.object({
	cage_climb: cageEnum.describe("What does the robot do in the cage area?"),
});

/**
 * Schema for miscellaneous data, not necessarily related to a period
 */
const miscSchema = z.object({
	defense_rating: z.coerce
		.number({ message: "Defense rating must be a number" })
		.int()
		.min(1, { message: "Defense rating must be valid" })
		.max(5, { message: "Defense rating must be valid" })
		.describe("Defense rating"),
	comments: z
		.string({ message: "Comments must be at least 32 characters" })
		.min(32, { message: "Comments must be at least 32 characters" })
		.describe("Comments about robot performance"),
});

export const standFormSchema = z.object({
	match_detail: matchDetailSchema.describe("Match details"),
	auto: autoSchema.describe("Autonomous"),
	teleop: teleopSchema.describe("Teleop"),
	endgame: endgameSchema.describe("Endgame"),
	misc: miscSchema.describe("Miscellaneous"),
});

export type StageMetadata = {
	id: string;
	title: string;
	description: string;
	schema:
		| typeof matchDetailSchema
		| typeof autoSchema
		| typeof teleopSchema
		| typeof endgameSchema
		| typeof miscSchema;
};

export const formMetadata = {
	steps: [
		{
			id: "match_detail",
			title: "Match Details",
			description: "Enter the match details",
			schema: matchDetailSchema,
		},
		{
			id: "auto",
			title: "Autonomous",
			description: "Enter the autonomous data",
			schema: autoSchema,
		},
		{
			id: "teleop",
			title: "Teleop",
			description: "Enter the teleop data",
			schema: teleopSchema,
		},
		{
			id: "endgame",
			title: "Endgame",
			description: "Enter the endgame data",
			schema: endgameSchema,
		},
		{
			id: "misc",
			title: "Miscellaneous",
			description: "Enter any miscellaneous data",
			schema: miscSchema,
		},
	] satisfies StageMetadata[],
};

export type StandFormData = z.infer<typeof standFormSchema>;
