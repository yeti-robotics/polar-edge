"use client";

import { getAllForms } from "./action";

import { StandForm } from "@/lib/types/forms";
import { Button } from "@repo/ui/components/button";
import { Download } from "lucide-react";

export default function DownloadStandForms() {
	const downloadCSV = async () => {
		const forms = await getAllForms();
		try {
			// Create CSV header
			const headers = [
				"Team Number",
				"Match ID",
				"Left Black Line",
				"Auto Coral Level 1",
				"Auto Coral Level 2",
				"Auto Coral Level 3",
				"Auto Coral Level 4",
				"Auto Algae Processed",
				"Auto Algae Netted",
				"Teleop Coral Level 1",
				"Teleop Coral Level 2",
				"Teleop Coral Level 3",
				"Teleop Coral Level 4",
				"Teleop Algae Processed",
				"Teleop Algae Netted",
				"Cage Climb",
				"Defense Rating",
				"Comments",
			];

			// Create CSV rows
			const rows = forms.map((form: Omit<StandForm, "userId">) => [
				form.teamNumber,
				form.matchId,
				form.leftBlackLine ? "Yes" : "No",
				form.autoCoralLevel1,
				form.autoCoralLevel2,
				form.autoCoralLevel3,
				form.autoCoralLevel4,
				form.autoAlgaeProcessor,
				form.autoAlgaeNet,
				form.teleopCoralLevel1,
				form.teleopCoralLevel2,
				form.teleopCoralLevel3,
				form.teleopCoralLevel4,
				form.teleopAlgaeProcessor,
				form.teleopAlgaeNet,
				form.cageClimb,
				form.defenseRating,
				form.comments,
			]);

			// Combine header and rows
			const csvContent = [
				headers.join(","),
				...rows.map((row: (string | number)[]) =>
					row.map((cell: string | number) => `"${cell}"`).join(",")
				),
			].join("\n");

			// Create and trigger download
			const blob = new Blob([csvContent], {
				type: "text/csv;charset=utf-8;",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.setAttribute("href", url);
			link.setAttribute("download", "stand_forms.csv");
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.error("Error downloading CSV:", error);
		}
	};

	return (
		<Button onClick={downloadCSV}>
			<Download className="mr-2 h-4 w-4" />
			Download CSV
		</Button>
	);
}
