import { ChartComparison } from "./chart-comparison";

import { db } from "@/lib/database";
import { standForm } from "@/lib/database/schema";
import { eq } from "drizzle-orm";

export default async function AnalysisComparisonPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const teamNumber = (await searchParams).teamNumber;

	console.log(teamNumber);

	if (!teamNumber) {
		return (
			<div className="container mx-auto py-10">
				No team number provided.
			</div>
		);
	}

	console.log("Fetching data for team number:", teamNumber);

	const coralTotals = await db
		.select({
			autoCoralL1: standForm.autoCoralLevel1,
			autoCoralL2: standForm.autoCoralLevel2,
			autoCoralL3: standForm.autoCoralLevel3,
			autoCoralL4: standForm.autoCoralLevel4,
			teleopCoralL1: standForm.teleopCoralLevel1,
			teleopCoralL2: standForm.teleopCoralLevel2,
			teleopCoralL3: standForm.teleopCoralLevel3,
			teleopCoralL4: standForm.teleopCoralLevel4,
		})
		.from(standForm)
		.where(eq(standForm.teamNumber, parseInt(teamNumber as string)));

	console.log(coralTotals);

	return (
		<div className="container mx-auto py-10">
			<ChartComparison />
			<h1 className="mb-6 text-2xl font-bold">Analysis Comparison</h1>
			<p>
				This page is under construction. Please check back later for
				analysis comparison functionality.
			</p>
		</div>
	);
}
