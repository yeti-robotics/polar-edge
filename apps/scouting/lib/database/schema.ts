import { enumToPgEnum } from "./utils";

import { avg, sql } from "drizzle-orm";
import {
	boolean,
	check,
	date,
	foreignKey,
	integer,
	pgEnum,
	pgTable,
	pgView,
	primaryKey,
	smallint,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export enum UserRole {
	USER = "user",
	ADMIN = "admin",
	GUEST = "guest",
	BANISHED = "banished",
}

// ordering of user roles from most to least permissive
export const userRoleOrdering: UserRole[] = [
	UserRole.ADMIN,
	UserRole.USER,
	UserRole.GUEST,
	UserRole.BANISHED,
];

export const userRoleEnum = pgEnum("user_role", enumToPgEnum(UserRole));

export const users = pgTable("user", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name"),
	email: text("email").unique(),
	emailVerified: timestamp("emailVerified"),
	image: text("image"),
	guildNickname: text("guildNickname"),
	role: userRoleEnum().default(UserRole.USER),
});

export const accounts = pgTable(
	"account",
	{
		userId: uuid("userId")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: text("type").$type<AdapterAccountType>().notNull(),
		provider: text("provider").notNull(),
		providerAccountId: text("providerAccountId").notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: text("token_type"),
		scope: text("scope"),
		id_token: text("id_token"),
		session_state: text("session_state"),
	},
	(acc) => [primaryKey({ columns: [acc.provider, acc.providerAccountId] })]
);

export const sessions = pgTable("session", {
	sessionToken: text("sessionToken").primaryKey(),
	userId: uuid("userId")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
	"verificationToken",
	{
		identifier: text("identifier").notNull(),
		token: text("token").notNull(),
		expires: timestamp("expires", { mode: "date" }).notNull(),
	},
	(verificationToken) => [
		{
			compositePk: primaryKey({
				columns: [
					verificationToken.identifier,
					verificationToken.token,
				],
			}),
		},
	]
);

export const authenticators = pgTable(
	"authenticator",
	{
		credentialID: text("credentialID").notNull().unique(),
		userId: uuid("userId")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		providerAccountId: text("providerAccountId").notNull(),
		credentialPublicKey: text("credentialPublicKey").notNull(),
		counter: integer("counter").notNull(),
		credentialDeviceType: text("credentialDeviceType").notNull(),
		credentialBackedUp: boolean("credentialBackedUp").notNull(),
		transports: text("transports"),
	},
	(authenticator) => [
		{
			compositePK: primaryKey({
				columns: [authenticator.userId, authenticator.credentialID],
			}),
		},
	]
);

export enum Cage {
	NONE = "None",
	SHALLOW = "ShallowCage",
	DEEP = "DeepCage",
	PARK = "Parked",
}

export enum Alliance {
	RED = "red",
	BLUE = "blue",
	EMPTY = "",
}

export enum YesNo {
	YES = "Yes",
	NO = "No",
}

export const cageEnum = pgEnum("cage", enumToPgEnum(Cage));
export const allianceEnum = pgEnum("alliance", enumToPgEnum(Alliance));
export const yesNoEnum = pgEnum("yes_no", enumToPgEnum(YesNo));

export const match = pgTable("match", {
	id: varchar("match_id", { length: 32 }).notNull().primaryKey(),
	compLevel: varchar("comp_level", { length: 2 }).notNull(),
	setNumber: smallint("set_number").notNull(),
	matchNumber: smallint("match_number").notNull(),
	eventKey: varchar("event_key", { length: 16 }).notNull(),
	winningAlliance: allianceEnum("winning_alliance").notNull(),
});

export const matchScoreBreakdown = pgTable(
	"match_score_breakdown",
	{
		matchId: varchar("match_id", { length: 32 })
			.notNull()
			.references(() => match.id),
		alliance: allianceEnum("alliance").notNull(),
		autoLineRobot1: boolean("auto_line_robot1").notNull(),
		autoLineRobot2: boolean("auto_line_robot2").notNull(),
		autoLineRobot3: boolean("auto_line_robot3").notNull(),
		autoMobilityPoints: integer("auto_mobility_points").notNull(),
		autoPoints: integer("auto_points").notNull(),
		autoReefTopRow: integer("auto_reef_top_row").notNull(),
		autoReefMidRow: integer("auto_reef_mid_row").notNull(),
		autoReefBotRow: integer("auto_reef_bot_row").notNull(),
		autoReefTrough: integer("auto_reef_trough").notNull(),
		bargeBonusAchieved: boolean("barge_bonus_achieved").notNull(),
		coopertitionCriteriaMet: boolean("coopertition_criteria_met").notNull(),
		coralBonusAchieved: boolean("coral_bonus_achieved").notNull(),
		endGameBargePoints: integer("end_game_barge_points").notNull(),
		endGameRobot1: cageEnum("end_game_robot1").notNull(),
		endGameRobot2: cageEnum("end_game_robot2").notNull(),
		endGameRobot3: cageEnum("end_game_robot3").notNull(),
		foulCount: integer("foul_count").notNull(),
		foulPoints: integer("foul_points").notNull(),
		g206Penalty: boolean("g206_penalty").notNull().default(false),
		g408Penalty: boolean("g408_penalty").notNull().default(false),
		g424Penalty: boolean("g424_penalty").notNull().default(false),
		netAlgaeCount: integer("net_algae_count").notNull(),
		rp: integer("rp").notNull(),
		techFoulCount: integer("tech_foul_count").notNull(),
		teleopCoralCount: integer("teleop_coral_count").notNull(),
		teleopCoralPoints: integer("teleop_coral_points").notNull(),
		teleopPoints: integer("teleop_points").notNull(),
		teleopReefTopRow: integer("teleop_reef_top_row").notNull(),
		teleopReefMidRow: integer("teleop_reef_mid_row").notNull(),
		teleopReefBotRow: integer("teleop_reef_bot_row").notNull(),
		teleopReefTrough: integer("teleop_reef_trough").notNull(),
		totalPoints: integer("total_points").notNull(),
		wallAlgaeCount: integer("wall_algae_count").notNull(),
	},
	(table) => [primaryKey({ columns: [table.matchId, table.alliance] })]
);

export const teamMatch = pgTable(
	"team_match",
	{
		matchId: varchar("match_id", { length: 32 })
			.notNull()
			.references(() => match.id),
		teamNumber: integer("team_number")
			.notNull()
			.references(() => team.teamNumber),
		alliance: allianceEnum().notNull(),
		alliancePosition: smallint("alliance_position").notNull(),
	},
	(table) => [
		{
			alliancePositionConstraint: check(
				"alliance_position_constraint",
				sql`${table.alliancePosition} in (1,2,3)`
			),
		},
		primaryKey({ columns: [table.matchId, table.teamNumber] }),
	]
);

export const standForm = pgTable(
	"stand_form",
	{
		id: uuid("stand_form_id").primaryKey().defaultRandom(),
		teamNumber: integer("team_number").notNull(),
		matchId: varchar("match_id", { length: 32 }).notNull(),
		userId: uuid("user_id")
			.references(() => users.id)
			.notNull(),
		leftBlackLine: boolean("left_black_line").notNull(),
		autoCoralLevel1: integer("auto_coral_level1").notNull(),
		autoCoralLevel2: integer("auto_coral_level2").notNull(),
		autoCoralLevel3: integer("auto_coral_level3").notNull(),
		autoCoralLevel4: integer("auto_coral_level4").notNull(),
		autoAlgaeProcessor: integer("auto_algae_processed").notNull(),
		autoAlgaeNet: integer("auto_algae_netted").notNull(),
		teleopCoralLevel1: integer("teleop_coral_level1").notNull(),
		teleopCoralLevel2: integer("teleop_coral_level2").notNull(),
		teleopCoralLevel3: integer("teleop_coral_level3").notNull(),
		teleopCoralLevel4: integer("teleop_coral_level4").notNull(),
		teleopAlgaeProcessor: integer("teleop_algae_processed").notNull(),
		teleopAlgaeNet: integer("teleop_algae_netted").notNull(),
		cageClimb: cageEnum("cage_climb").notNull(),
		defenseRating: integer("defense_rating").notNull(),
		comments: text("comments").notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.teamNumber, table.matchId],
			foreignColumns: [teamMatch.teamNumber, teamMatch.matchId],
		}),
		uniqueIndex("stand_form_unique_idx").on(
			table.teamNumber,
			table.matchId,
			table.userId
		),
	]
);

export const tournament = pgTable(
	"tournament",
	{
		id: varchar("tournament_id", { length: 16 }).notNull().primaryKey(),
		eventName: varchar("event_name", { length: 256 }).notNull(),
		startDate: date("start_date").notNull(),
		endDate: date("end_date").notNull(),
		isCurrent: boolean("is_current").notNull().default(false),
	},
	(table) => [
		uniqueIndex("tournament_current_idx")
			.on(table.isCurrent)
			.where(sql`${table.isCurrent} = true`),
	]
);

export const team = pgTable("team", {
	teamNumber: integer("team_number").notNull().primaryKey(),
	teamName: varchar("team_name", { length: 256 }).notNull().default(""),
});

export const teamMatchStats = pgView("team_match_stats").as((qb) =>
	qb
		.select({
			teamNumber: standForm.teamNumber,
			matchId: standForm.matchId,
			autoCoralLevel1: avg(standForm.autoCoralLevel1)
				.mapWith(Number)
				.as("auto_coral_level_1"),
			autoCoralLevel2: avg(standForm.autoCoralLevel2)
				.mapWith(Number)
				.as("auto_coral_level_2"),
			autoCoralLevel3: avg(standForm.autoCoralLevel3)
				.mapWith(Number)
				.as("auto_coral_level_3"),
			autoCoralLevel4: avg(standForm.autoCoralLevel4)
				.mapWith(Number)
				.as("auto_coral_level_4"),
			autoAlgaeProcessor: avg(standForm.autoAlgaeProcessor)
				.mapWith(Number)
				.as("auto_algae_processor"),
			autoAlgaeNet: avg(standForm.autoAlgaeNet)
				.mapWith(Number)
				.as("auto_algae_net"),
			teleopCoralLevel1: avg(standForm.teleopCoralLevel1)
				.mapWith(Number)
				.as("teleop_coral_level_1"),
			teleopCoralLevel2: avg(standForm.teleopCoralLevel2)
				.mapWith(Number)
				.as("teleop_coral_level_2"),
			teleopCoralLevel3: avg(standForm.teleopCoralLevel3)
				.mapWith(Number)
				.as("teleop_coral_level_3"),
			teleopCoralLevel4: avg(standForm.teleopCoralLevel4)
				.mapWith(Number)
				.as("teleop_coral_level_4"),
			teleopAlgaeProcessor: avg(standForm.teleopAlgaeProcessor)
				.mapWith(Number)
				.as("teleop_algae_processor"),
			teleopAlgaeNet: avg(standForm.teleopAlgaeNet)
				.mapWith(Number)
				.as("teleop_algae_net"),
			parkPercentage:
				sql<number>`AVG(CASE WHEN ${standForm.cageClimb} = 'Parked' THEN 1 ELSE 0 END)`.as(
					"park_percentage"
				),
			shallowPercentage:
				sql<number>`AVG(CASE WHEN ${standForm.cageClimb} = 'ShallowCage' THEN 1 ELSE 0 END)`.as(
					"shallow_percentage"
				),
			deepPercentage:
				sql<number>`AVG(CASE WHEN ${standForm.cageClimb} = 'DeepCage' THEN 1 ELSE 0 END)`.as(
					"deep_percentage"
				),
			defenseRating: avg(standForm.defenseRating)
				.mapWith(Number)
				.as("defense_rating"),
			initiationLine:
				sql<number>`AVG(CAST(${standForm.leftBlackLine} AS INT))`
					.mapWith(Number)
					.as("initiation_line"),
		})
		.from(standForm)
		.groupBy(sql`${standForm.teamNumber}, ${standForm.matchId}`)
);
