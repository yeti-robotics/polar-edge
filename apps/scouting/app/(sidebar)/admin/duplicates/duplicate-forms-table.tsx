"use client";

import { deleteForm } from "@/lib/actions/forms";
import { type DuplicateFormGroup } from "@/lib/types/forms";
import { Button } from "@repo/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { useState } from "react";

interface DuplicateFormsTableProps {
	duplicates: DuplicateFormGroup[];
}

export function DuplicateFormsTable({ duplicates }: DuplicateFormsTableProps) {
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const handleDelete = async (formId: string) => {
		try {
			setDeletingId(formId);
			await deleteForm(formId);
		} catch (error) {
			console.error("Failed to delete form:", error);
			alert("Failed to delete form. Please try again.");
		} finally {
			setDeletingId(null);
		}
	};

	console.log(duplicates);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Team</TableHead>
					<TableHead>Match</TableHead>
					<TableHead>Count</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{duplicates.map((group) => (
					<TableRow key={`${group.teamNumber}-${group.matchId}`}>
						<TableCell>{group.teamNumber}</TableCell>
						<TableCell>{group.matchId}</TableCell>
						<TableCell>{group.count}</TableCell>
						<TableCell>
							<div className="flex gap-2">
								{group.forms.map((form) => {
									console.log(form);
									return (
										<Button
											key={form.id}
											variant="destructive"
											size="sm"
											onClick={() =>
												handleDelete(form.id)
											}
											disabled={deletingId === form.id}
										>
											{deletingId === form.id
												? "Deleting..."
												: "Delete"}
										</Button>
									);
								})}
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
