import { getAllTournaments } from "./actions/tournament-data";
import { TournamentPicker } from "./components/TournamentPicker";

export default async function AnalysisLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const tournaments = await getAllTournaments();
	if (!tournaments.success) {
		return <div>Error fetching tournaments</div>;
	}
	return (
		<div>
			<div className="mb-4 flex w-fit justify-center">
				<TournamentPicker tournaments={tournaments.value} />
			</div>
			{children}
		</div>
	);
}
