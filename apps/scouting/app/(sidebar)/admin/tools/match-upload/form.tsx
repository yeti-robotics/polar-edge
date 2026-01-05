"use client";

import { submitForm } from "./action";

import { Button } from "@repo/ui/components/button";
import { DatePicker } from "@repo/ui/components/date-picker";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useToast } from "@repo/ui/hooks/use-toast";
import { useActionState, useEffect } from "react";

export function MatchUploadForm() {
	const [state, formAction, isPending] = useActionState(submitForm, {
		success: false,
		error: null,
	});

	const { toast } = useToast();

	useEffect(() => {
		console.log("Form state changed:", state);
		if (state.success) {
			console.log("Match schedule uploaded successfully.");
			toast({
				title: "Success",
				description: "Match schedule uploaded successfully.",
				duration: 5000,
			});
		} else {
			console.error("Failed to upload match schedule:", state.error);
		}
	}, [state, toast]);

	return (
		<form action={formAction} className="flex flex-col gap-y-4">
			<div className="flex gap-x-2">
				<div>
					<Label htmlFor="eventCode" className="mb-2 block text-sm">
						Event Code
					</Label>
					<Input placeholder="2025thor" name="eventCode" />
				</div>
				<div>
					<Label htmlFor="eventName" className="mb-2 block text-sm">
						Event Name
					</Label>
					<Input
						placeholder="2025 Thor West Offseason"
						name="eventName"
					/>
				</div>
			</div>
			<div className="flex gap-x-2">
				<div>
					<Label htmlFor="startDate" className="mb-2 block text-sm">
						Start Date
					</Label>
					<DatePicker name="startDate" />
				</div>
				<div>
					<Label htmlFor="endDate" className="mb-2 block text-sm">
						End Date
					</Label>
					<DatePicker name="endDate" />
				</div>
			</div>
			<div>
				<Label htmlFor="csvUpload" className="mb-2 block text-sm">
					Upload Match Schedule CSV
				</Label>
				<Input
					className="w-fit"
					type="file"
					accept=".csv"
					name="csvUpload"
				/>
			</div>
			<div className="flex">
				<Button disabled={isPending} className="btn btn-primary">
					{isPending ? "Uploading..." : "Upload"}
				</Button>
			</div>
		</form>
	);
}
