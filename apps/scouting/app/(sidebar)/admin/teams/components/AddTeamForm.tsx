"use client";

import { addTeamFromTBA } from "../actions";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { useToast } from "@repo/ui/hooks/use-toast";
import { useState, useTransition } from "react";

export function AddTeamForm() {
	const [teamNumber, setTeamNumber] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, startTransition] = useTransition();
	const { toast } = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		startTransition(async () => {
			e.preventDefault();
			setIsLoading(true);

			try {
				const number = parseInt(teamNumber, 10);
				if (isNaN(number)) {
					toast({
						title: "Invalid team number",
						description: "Please enter a valid number",
						variant: "destructive",
					});
					return;
				}

				const result = await addTeamFromTBA(number);

				if (result.success) {
					toast({
						title: "Team added successfully",
						description: `Added team ${result.value.team.teamNumber} - ${result.value.team.teamName}`,
					});
					setTeamNumber("");
				} else {
					toast({
						title: "Error adding team",
						description: result.error,
						variant: "destructive",
					});
				}
			} catch (error) {
				console.error(error);
				toast({
					title: "Error adding team",
					description: "An unexpected error occurred",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex items-end gap-2">
			<div className="flex flex-col gap-2">
				<label htmlFor="teamNumber">Add Team Number</label>
				<Input
					id="teamNumber"
					type="number"
					placeholder="Enter team number..."
					value={teamNumber}
					onChange={(e) => setTeamNumber(e.target.value)}
					disabled={isLoading}
				/>
			</div>
			<Button type="submit" disabled={isLoading}>
				{isLoading ? "Adding..." : "Add Team"}
			</Button>
		</form>
	);
}
