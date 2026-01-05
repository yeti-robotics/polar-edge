import { fetchEvents } from "./actions";
import { AddTeamForm } from "./components/AddTeamForm";
import { TeamSearch } from "./components/TeamSearch";
import {
	TeamTableWrapper,
	TeamTableWrapperSkeleton,
} from "./components/TeamTableWrapper";

import { checkSession } from "@/lib/auth/utils";
import { UserRole } from "@/lib/database/schema";
import { Suspense } from "react";

interface PageProps {
	searchParams: Promise<{
		page?: string;
		sortBy?: string;
		sortDir?: string;
		search?: string;
		eventId?: string;
	}>;
}

export default async function TeamsPage({
	searchParams: searchParamsPromise,
}: PageProps) {
	await checkSession(UserRole.ADMIN);

	const searchParams = await searchParamsPromise;
	const page = Number(searchParams.page) || 1;
	const sortBy = (searchParams.sortBy || "teamNumber") as
		| "teamNumber"
		| "teamName";
	const sortDirection = (searchParams.sortDir || "asc") as "asc" | "desc";
	const search = searchParams.search || "";
	const eventId = searchParams.eventId || "";

	const eventsResult = await fetchEvents();
	if (!eventsResult.success) {
		return <div>Error loading events</div>;
	}

	return (
		<div className="flex flex-col px-4">
			<h1 className="text-2xl font-bold">Teams</h1>
			<p className="text-muted-foreground text-sm">
				Search for a team by team number or name.
			</p>
			<div className="mt-4 flex flex-col gap-4">
				<section>
					<AddTeamForm />
				</section>
				<hr />
				<section className="flex flex-col gap-4">
					<div>
						<h2 className="text-base">All Teams</h2>
					</div>
					<TeamSearch events={eventsResult.value} />
					<Suspense
						key={`${page}-${sortBy}-${sortDirection}-${search}-${eventId}`}
						fallback={<TeamTableWrapperSkeleton />}
					>
						<TeamTableWrapper
							page={page}
							pageSize={25}
							sortBy={sortBy}
							sortDirection={sortDirection}
							search={search}
							eventId={eventId}
						/>
					</Suspense>
				</section>
			</div>
		</div>
	);
}
