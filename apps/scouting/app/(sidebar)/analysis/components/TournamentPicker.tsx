"use client";

import { TournamentData } from "../actions/tournament-data";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

const TOURNAMENT_ID_QUERY_PARAM = "id";

export function TournamentPicker({
	tournaments,
}: {
	tournaments: TournamentData;
}) {
	const currentTournament = tournaments.find((t) => t.isCurrent);
	const searchParams = useSearchParams();
	const router = useRouter();

	const tournamentId =
		searchParams.get(TOURNAMENT_ID_QUERY_PARAM) ??
		currentTournament?.id ??
		"";

	return (
		<Select
			onValueChange={(value) => {
				const query = new URLSearchParams(searchParams.toString());
				query.set(TOURNAMENT_ID_QUERY_PARAM, value);
				router.push(`?${query.toString()}`);
			}}
			value={tournamentId}
		>
			<SelectTrigger className="min-w-fit">
				<SelectValue placeholder="Select a tournament" />
			</SelectTrigger>
			<SelectContent>
				{tournaments.map((t) => (
					<SelectItem key={t.id} value={t.id}>
						{t.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
