import { CurrentEvent } from "./current-event";

import { checkSession } from "@/lib/auth/utils";
import { seedEvent } from "@/lib/data/thebluealliance/event";
import { seedMatches } from "@/lib/data/thebluealliance/match";
import { db } from "@/lib/database";
import { tournament, UserRole } from "@/lib/database/schema";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { desc, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { Suspense } from "react";

export default async function AdminTools() {
	await checkSession(UserRole.ADMIN);

	return (
		<div className="flex flex-col gap-6">
			<section className="flex flex-col">
				<h1 className="text-2xl font-bold">Admin Tools</h1>
				<p className="text-muted-foreground text-sm">
					Use these tools to set the current event and seed data from
					The Blue Alliance.
				</p>
			</section>
			<hr />
			<section className="flex flex-col gap-2">
				<h2 className="text-lg font-semibold">Add Event</h2>
				<form action={seedEvent} className="flex flex-col gap-2">
					<div className="flex flex-col gap-2">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end">
							<div className="flex flex-col gap-1">
								<Label htmlFor="eventKey" className="text-sm">
									Event Key
								</Label>
								<Input
									type="text"
									name="eventKey"
									placeholder="2025ncmec"
									className="w-fit placeholder:text-sm"
								/>
							</div>
							<Button type="submit" className="w-fit gap-1">
								<Plus className="size-4" />
								Add Event
							</Button>
						</div>
						<p className="text-muted-foreground my-1 max-w-prose text-xs">
							This is the event key for the event you want to add.
							It can be found on the event page of The Blue
							Alliance by looking at the URL.
						</p>
					</div>
				</form>
			</section>
			<hr />
			<section className="flex flex-col gap-2">
				<h2 className="text-lg font-semibold">Current Event</h2>
				<Suspense fallback={<div>Loading...</div>}>
					<CurrentEvent />
				</Suspense>
				<p className="text-muted-foreground my-1 max-w-prose text-xs">
					Select the event you want to set as the current event.
				</p>
			</section>
			<hr />
			<section className="flex flex-col gap-2">
				<h2 className="text-lg font-semibold">Seed Matches</h2>
				<form
					action={async () => {
						"use server";
						const currentEvent = await db
							.select()
							.from(tournament)
							.where(eq(tournament.isCurrent, true))
							.orderBy(desc(tournament.startDate))
							.limit(1);

						if (!currentEvent[0]) {
							throw new Error("Event not found");
						}
						await seedMatches(currentEvent[0].id);
					}}
				>
					<Button type="submit" className="w-fit gap-1">
						<Plus className="size-4" />
						Seed Matches
					</Button>
				</form>
				<p className="text-muted-foreground my-1 max-w-prose text-xs">
					Seed matches from The Blue Alliance for the current event.
				</p>
			</section>
		</div>
	);
}
