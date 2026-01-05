"use client";

import { DataTable } from "./DataTable";
import { TeamData } from "../actions/team-data";

import { Button } from "@repo/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
	CellContext,
	Column,
	ColumnDef,
	ColumnFiltersState,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
	VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function NumberDisplay({ value }: { value: number }) {
	return <>{Number(value).toFixed(1)}</>;
}

function PercentDisplay({ value }: { value: number }) {
	return <>{(value * 100).toFixed(0)}%</>;
}

function SortableHeader({
	label,
	column,
}: {
	label: string;
	column: Column<TeamData, string | number>;
}) {
	return (
		<Button
			variant="ghost"
			onClick={() => {
				column.toggleSorting(column.getIsSorted() === "asc");
			}}
		>
			{label}
			{column.getIsSorted() === "asc" ? (
				<ChevronUp className="ml-2 size-4" />
			) : (
				<ChevronDown className="ml-2 size-4" />
			)}
		</Button>
	);
}

const columnHelper = createColumnHelper<TeamData>();

function numericAccessor(key: keyof TeamData, label: string) {
	return columnHelper.accessor(key, {
		cell: (info: CellContext<TeamData, number>) => (
			<NumberDisplay value={info.getValue()} />
		),
		header: ({ column }) => (
			<SortableHeader label={label} column={column} />
		),
		footer: (props) => props.column.id,
	});
}

const generateCoralColumns = (gamePeriod: "auto" | "teleop") => {
	const columns = Array(4)
		.fill(null)
		.map((_, i) => ++i)
		.map((i) =>
			numericAccessor(
				`${gamePeriod}_coral_level_${i}` as keyof TeamData,
				`L${i}`
			)
		);

	return columnHelper.group({
		header: "Coral",
		footer: (props) => props.column.id,
		columns,
	});
};

const generateAlgaeColumns = (gamePeriod: "auto" | "teleop") => {
	const algaeActions = ["Net", "Processor"];

	const columns = algaeActions.map((a) =>
		numericAccessor(
			`${gamePeriod}_algae_${a.toLowerCase()}` as keyof TeamData,
			a
		)
	);

	return columnHelper.group({
		header: "Algae",
		footer: (props) => props.column.id,
		columns,
	});
};

const columns: ColumnDef<TeamData>[] = [
	columnHelper.group({
		header: "Team",
		footer: (props) => props.column.id,
		enableHiding: false,
		columns: [
			columnHelper.accessor("team_number", {
				cell: (info) => (
					<Link
						className="text-blue-400 underline decoration-dotted underline-offset-2"
						href={`/team/${info.getValue()}`}
					>
						{info.getValue()}
					</Link>
				),
				header: ({ column }) => (
					<SortableHeader label={"Team Number"} column={column} />
				),
				footer: (info) => info.column.id,
				filterFn: (row, columnId, filterValue) => {
					return String(row.getValue(columnId)).startsWith(
						filterValue
					);
				},
			}),
			columnHelper.accessor("team_name", {
				cell: (info) => info.getValue(),
				header: ({ column }) => (
					<SortableHeader label={"Team Name"} column={column} />
				),
				footer: (info) => info.column.id,
			}),
		],
	}),
	columnHelper.group({
		header: "Auto",
		footer: (props) => props.column.id,
		columns: [
			columnHelper.accessor("initiation_line", {
				cell: (info) => <PercentDisplay value={info.getValue()} />,
				header: ({ column }) => (
					<SortableHeader label={"Auto Line"} column={column} />
				),
				footer: (info) => info.column.id,
			}),
			generateCoralColumns("auto"),
			generateAlgaeColumns("auto"),
		],
	}),
	columnHelper.group({
		header: "Teleop",
		footer: (props) => props.column.id,
		columns: [
			generateCoralColumns("teleop"),
			generateAlgaeColumns("teleop"),
		],
	}),
	columnHelper.group({
		header: "Cage",
		footer: (props) => props.column.id,
		columns: [
			columnHelper.accessor("shallow_percentage", {
				cell: (info) => <PercentDisplay value={info.getValue()} />,
				header: ({ column }) => (
					<SortableHeader label={"Shallow"} column={column} />
				),
				footer: (info) => info.column.id,
			}),
			columnHelper.accessor("deep_percentage", {
				cell: (info) => <PercentDisplay value={info.getValue()} />,
				header: ({ column }) => (
					<SortableHeader label={"Deep"} column={column} />
				),
				footer: (info) => info.column.id,
			}),
			columnHelper.accessor("park_percentage", {
				cell: (info) => <PercentDisplay value={info.getValue()} />,
				header: ({ column }) => (
					<SortableHeader label={"Park"} column={column} />
				),
				footer: (info) => info.column.id,
			}),
		],
	}),
	columnHelper.group({
		header: "Misc",
		footer: (props) => props.column.id,
		columns: [
			columnHelper.accessor("defense_rating", {
				cell: (info) => <NumberDisplay value={info.getValue()} />,
				header: ({ column }) => (
					<SortableHeader label={"Defense"} column={column} />
				),
				footer: (info) => info.column.id,
			}),
		],
	}),
];

export function TeamDataTable({ teamData }: { teamData: TeamData[] }) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnVisibility, setVisibility] = useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const table = useReactTable<TeamData>({
		data: teamData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onColumnVisibilityChange: setVisibility,
		onColumnFiltersChange: setColumnFilters,
		state: {
			sorting,
			columnVisibility,
			columnFilters,
		},
	});

	return (
		<div className="flex flex-col space-y-4">
			<div className="flex flex-col items-start justify-between space-y-4 space-x-4 md:flex-row md:items-center md:space-y-0">
				<div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
					<Input
						placeholder="Find team number..."
						value={
							(table
								.getColumn("team_number")
								?.getFilterValue() as string) ?? ""
						}
						onChange={(event) =>
							table
								.getColumn("team_number")
								?.setFilterValue(event.target.value)
						}
					/>
				</div>
				<div className="pr-4 md:pr-0">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="ml-auto">
								Columns <ChevronDown className="ml-2 size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onClick={() => {
												column
													.getLeafColumns()
													.map((c) =>
														c.toggleVisibility()
													);
											}}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<div className="border-2">
				{teamData?.length ? (
					<DataTable table={table} />
				) : (
					<Skeleton className="h-16" />
				)}
			</div>
		</div>
	);
}
