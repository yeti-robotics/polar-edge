import { scoutedTeamData } from "./actions/team-data";
import { getAllTournaments } from "./actions/tournament-data";
import { TeamDataTable } from "./components/TeamDataTable";

export default async function TeamData({
	searchParams,
}: {
	searchParams: Promise<{ id?: string }>;
}) {
	const tournamentId = (await searchParams).id;
	const teamDataResult = await scoutedTeamData(tournamentId);
	const tournamentData = await getAllTournaments();

	return (
		<div className="flex flex-col">
			<h1 className="text-2xl leading-none font-semibold tracking-tight md:text-3xl">
				Team Data
			</h1>
			<div className="my-4">
				{!teamDataResult.success
					? "Error fetching team data"
					: !tournamentData.success
						? "Error fetching tournament data"
						: teamDataResult.value.length < 1
							? "No team data yet"
							: ""}
			</div>
			<div>
				{teamDataResult.success && tournamentData.success && (
					<TeamDataTable teamData={teamDataResult.value} />
				)}
			</div>
		</div>
	);
}

export const dynamic = "force-dynamic";
