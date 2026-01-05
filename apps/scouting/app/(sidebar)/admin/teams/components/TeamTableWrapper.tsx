import { fetchTeams } from "../actions";
import { TeamTable } from "./TeamTable";

import { Skeleton } from "@repo/ui/components/skeleton";
import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableHead,
	TableCell,
} from "@repo/ui/components/table";

interface TeamTableWrapperProps {
	page: number;
	pageSize: number;
	sortBy: "teamNumber" | "teamName";
	sortDirection: "asc" | "desc";
	search: string;
	eventId: string;
}

export async function TeamTableWrapper({
	page,
	pageSize,
	sortBy,
	sortDirection,
	search,
	eventId,
}: TeamTableWrapperProps) {
	const result = await fetchTeams({
		page,
		pageSize,
		sortBy,
		sortDirection,
		search,
		eventId,
	});

	await new Promise((resolve) => setTimeout(resolve, 1000));

	if (!result.success) {
		return <div>Error loading teams</div>;
	}

	return (
		<TeamTable
			teams={result.value.teams}
			totalPages={result.value.totalPages}
			currentPage={result.value.currentPage}
		/>
	);
}

export function TeamTableWrapperSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[150px]">
							<Skeleton className="h-10 w-28" />
						</TableHead>
						<TableHead>
							<Skeleton className="h-10 w-28" />
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{[1, 2, 3].map((i) => (
						<TableRow key={i}>
							<TableCell className="w-[150px]">
								<Skeleton className="h-6 w-16" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-6 w-48" />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
