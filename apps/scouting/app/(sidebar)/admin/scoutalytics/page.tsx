import { checkSession } from "@/lib/auth/utils";
import { db } from "@/lib/database";
import { match, standForm, tournament, users } from "@/lib/database/schema";
import { UserRole } from "@/lib/database/schema";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { count, desc, eq } from "drizzle-orm";

export default async function ScoutalyticsPage({
	searchParams: searchParamsPromise,
}: {
	searchParams: Promise<{ eventKey?: string }>;
}) {
	// Check if user has admin privileges
	await checkSession(UserRole.ADMIN);

	const searchParams = await searchParamsPromise;

	// Query to count forms submitted by each scout
	const scoutFormCounts = await db
		.select({
			userId: standForm.userId,
			name: users.name,
			guildNickname: users.guildNickname,
			formCount: count(standForm.id),
		})
		.from(standForm)
		.leftJoin(users, eq(standForm.userId, users.id))
		.leftJoin(match, eq(standForm.matchId, match.id))
		.leftJoin(tournament, eq(match.eventKey, tournament.id))
		.where(
			searchParams.eventKey
				? eq(match.eventKey, searchParams.eventKey)
				: undefined
		)
		.groupBy(standForm.userId, users.name, users.guildNickname)
		.orderBy(desc(count(standForm.id)));

	return (
		<div className="container mx-auto py-10">
			<h1 className="mb-6 text-2xl font-bold">
				Scout Form Submission Analytics
			</h1>
			<div className="rounded-md border">
				<Table>
					<TableCaption>
						A list of scouts and the number of forms they have
						submitted
					</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[300px]">
								Scout Name
							</TableHead>
							<TableHead className="text-right">
								Forms Submitted
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{scoutFormCounts.map((scout) => (
							<TableRow key={scout.userId}>
								<TableCell className="font-medium">
									{scout.guildNickname ||
										scout.name ||
										"Unknown Scout"}
								</TableCell>
								<TableCell className="text-right">
									{scout.formCount}
								</TableCell>
							</TableRow>
						))}
						{scoutFormCounts.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={2}
									className="text-muted-foreground py-6 text-center"
								>
									No form submissions found
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
