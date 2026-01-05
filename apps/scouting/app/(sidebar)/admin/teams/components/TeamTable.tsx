"use client";

import { Button } from "@repo/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Hash,
	Text,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface TeamTableProps {
	teams: {
		teamNumber: number;
		teamName: string;
	}[];
	totalPages: number;
	currentPage: number;
}

export function TeamTable({ teams, totalPages, currentPage }: TeamTableProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, startTransition] = useTransition();

	const createQueryString = useCallback(
		(params: Record<string, string>) => {
			const current = new URLSearchParams(searchParams.toString());

			Object.entries(params).forEach(([key, value]) => {
				if (value) {
					current.set(key, value);
				} else {
					current.delete(key);
				}
			});

			return current.toString();
		},
		[searchParams]
	);

	const handleSort = (column: "teamNumber" | "teamName") => {
		const currentSort = searchParams.get("sortBy");
		const currentDir = searchParams.get("sortDir");

		const newDir =
			currentSort === column && currentDir === "asc" ? "desc" : "asc";

		router.push(
			`?${createQueryString({
				sortBy: column,
				sortDir: newDir,
			})}`
		);
	};

	const handlePageChange = (newPage: number) => {
		startTransition(() => {
			router.push(`?${createQueryString({ page: newPage.toString() })}`);
		});
	};

	return (
		<div className="flex flex-col gap-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[150px] p-0">
							<Button
								variant="ghost"
								onClick={() => handleSort("teamNumber")}
							>
								<Hash className="size-4" />
								Team Number
								{(searchParams.get("sortBy") === "teamNumber" ||
									!searchParams.get("sortBy")) &&
									(searchParams.get("sortDir") === "asc" ||
									!searchParams.get("sortDir") ? (
										<ChevronUp className="size-4" />
									) : (
										<ChevronDown className="size-4" />
									))}
							</Button>
						</TableHead>
						<TableHead>
							<Button
								variant="ghost"
								onClick={() => handleSort("teamName")}
							>
								<Text className="size-4" />
								Team Name
								{searchParams.get("sortBy") === "teamName" &&
									(searchParams.get("sortDir") === "asc" ? (
										<ChevronUp className="size-4" />
									) : (
										<ChevronDown className="size-4" />
									))}
							</Button>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{teams.map((team) => (
						<TableRow key={team.teamNumber}>
							<TableCell className="w-[150px] px-4">
								{team.teamNumber}
							</TableCell>
							<TableCell className="px-8">
								{team.teamName}
							</TableCell>
						</TableRow>
					))}
					{teams.length === 0 && (
						<TableRow>
							<TableCell colSpan={2} className="text-center">
								No teams found
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
			<div className="flex items-center justify-center gap-2 text-center">
				<Button
					variant="outline"
					onClick={() => handlePageChange(currentPage - 1)}
					disabled={currentPage <= 1}
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<span className="text-sm font-medium">
					Page {currentPage} of {totalPages}
				</span>
				<Button
					variant="outline"
					onClick={() => handlePageChange(currentPage + 1)}
					disabled={currentPage >= totalPages}
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
