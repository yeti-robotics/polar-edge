import {
	createServerAction,
	ServerActionError,
} from "@/lib/actions/actions-utils";
import { db } from "@/lib/database";
import { match, team, teamMatchStats, tournament } from "@/lib/database/schema";
import { avg, eq, sql } from "drizzle-orm";

export const scoutedTeamData = createServerAction(
	async (id: string | undefined): Promise<TeamData[]> => {
		try {
			const stats = db.$with("stats").as(
				db
					.select({
						team_number: teamMatchStats.teamNumber,
						auto_coral_level_1: avg(teamMatchStats.autoCoralLevel1)
							.mapWith(Number)
							.as("auto_coral_level_1"),
						auto_coral_level_2: avg(teamMatchStats.autoCoralLevel2)
							.mapWith(Number)
							.as("auto_coral_level_2"),
						auto_coral_level_3: avg(teamMatchStats.autoCoralLevel3)
							.mapWith(Number)
							.as("auto_coral_level_3"),
						auto_coral_level_4: avg(teamMatchStats.autoCoralLevel4)
							.mapWith(Number)
							.as("auto_coral_level_4"),
						auto_algae_processor: avg(
							teamMatchStats.autoAlgaeProcessor
						)
							.mapWith(Number)
							.as("auto_algae_processor"),
						auto_algae_net: avg(teamMatchStats.autoAlgaeNet)
							.mapWith(Number)
							.as("auto_algae_net"),
						teleop_coral_level_1: avg(
							teamMatchStats.teleopCoralLevel1
						)
							.mapWith(Number)
							.as("teleop_coral_level_1"),
						teleop_coral_level_2: avg(
							teamMatchStats.teleopCoralLevel2
						)
							.mapWith(Number)
							.as("teleop_coral_level_2"),
						teleop_coral_level_3: avg(
							teamMatchStats.teleopCoralLevel3
						)
							.mapWith(Number)
							.as("teleop_coral_level_3"),
						teleop_coral_level_4: avg(
							teamMatchStats.teleopCoralLevel4
						)
							.mapWith(Number)
							.as("teleop_coral_level_4"),
						teleop_algae_processor: avg(
							teamMatchStats.teleopAlgaeProcessor
						)
							.mapWith(Number)
							.as("teleop_algae_processor"),
						teleop_algae_net: avg(teamMatchStats.teleopAlgaeNet)
							.mapWith(Number)
							.as("teleop_algae_net"),
						park_percentage: avg(teamMatchStats.parkPercentage)
							.mapWith(Number)
							.as("park_percentage"),
						shallow_percentage: avg(
							teamMatchStats.shallowPercentage
						)
							.mapWith(Number)
							.as("shallow_percentage"),
						deep_percentage: avg(teamMatchStats.deepPercentage)
							.mapWith(Number)
							.as("deep_percentage"),
						defense_rating: avg(teamMatchStats.defenseRating)
							.mapWith(Number)
							.as("defense_rating"),
						initiation_line: avg(teamMatchStats.initiationLine)
							.mapWith(Number)
							.as("initiation_line"),
					})
					.from(teamMatchStats)
					.innerJoin(match, eq(match.id, teamMatchStats.matchId))
					.innerJoin(tournament, eq(match.eventKey, tournament.id))
					.where(
						id
							? eq(tournament.id, id)
							: eq(tournament.isCurrent, true)
					)
					.groupBy(teamMatchStats.teamNumber)
			);

			return db
				.with(stats)
				.select({
					team_number: stats.team_number,
					team_name: sql<string>`COALESCE(${team.teamName}, '')`,
					auto_coral_level_1: stats.auto_coral_level_1,
					auto_coral_level_2: stats.auto_coral_level_2,
					auto_coral_level_3: stats.auto_coral_level_3,
					auto_coral_level_4: stats.auto_coral_level_4,
					auto_algae_processor: stats.auto_algae_processor,
					auto_algae_net: stats.auto_algae_net,
					teleop_coral_level_1: stats.teleop_coral_level_1,
					teleop_coral_level_2: stats.teleop_coral_level_2,
					teleop_coral_level_3: stats.teleop_coral_level_3,
					teleop_coral_level_4: stats.teleop_coral_level_4,
					teleop_algae_processor: stats.teleop_algae_processor,
					teleop_algae_net: stats.teleop_algae_net,
					park_percentage: stats.park_percentage,
					shallow_percentage: stats.shallow_percentage,
					deep_percentage: stats.deep_percentage,
					defense_rating: stats.defense_rating,
					initiation_line: stats.initiation_line,
				})
				.from(stats)
				.leftJoin(team, eq(team.teamNumber, stats.team_number));
		} catch (error) {
			console.error("Error fetching team data:", error);
			throw new ServerActionError("Failed to fetch team data");
		}
	}
);

export type TeamData = {
	team_number: number;
	team_name: string;
	auto_coral_level_1: number;
	auto_coral_level_2: number;
	auto_coral_level_3: number;
	auto_coral_level_4: number;
	auto_algae_processor: number;
	auto_algae_net: number;
	teleop_coral_level_1: number;
	teleop_coral_level_2: number;
	teleop_coral_level_3: number;
	teleop_coral_level_4: number;
	teleop_algae_processor: number;
	teleop_algae_net: number;
	park_percentage: number;
	shallow_percentage: number;
	deep_percentage: number;
	initiation_line: number;
	defense_rating: number;
};
