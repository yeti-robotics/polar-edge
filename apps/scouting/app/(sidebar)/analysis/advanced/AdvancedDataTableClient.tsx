"use client";

import { AdvancedTeamData } from "./AdvancedDataTable";
import { DataTable } from "../components/DataTable";

import { Button } from "@repo/ui/components/button";
import {
	Column,
	ColumnFiltersState,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function NumberDisplay({ value }: { value: number }) {
	return <>{Number(value).toFixed(1)}</>;
}

function SortableHeader({
	label,
	column,
}: {
	label: string;
	column: Column<AdvancedTeamData, string | number>;
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

const columnHelper = createColumnHelper<AdvancedTeamData>();

const columns = [
	columnHelper.accessor("team_number", {
		cell: (info) => (
			<Link
				className="text-left text-blue-400 underline decoration-dotted underline-offset-2"
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
			return String(row.getValue(columnId)).startsWith(filterValue);
		},
	}),

	columnHelper.accessor("team_name", {
		cell: (info) => <div className="text-left">{info.getValue()}</div>,
		header: ({ column }) => (
			<SortableHeader label={"Team Name"} column={column} />
		),
		footer: (info) => info.column.id,
	}),
	columnHelper.group({
		header: "Game Period",
		footer: (props) => props.column.id,
		columns: [
			columnHelper.accessor("auto_total", {
				cell: (info) => (
					<div className="w-20 text-right">
						<NumberDisplay value={info.getValue()} />
					</div>
				),
				header: ({ column }) => (
					<SortableHeader label="aEPA" column={column} />
				),
				footer: (info) => info.column.id,
			}),
			columnHelper.accessor("teleop_total", {
				cell: (info) => (
					<div className="w-20 text-right">
						<NumberDisplay value={info.getValue()} />
					</div>
				),
				header: ({ column }) => (
					<SortableHeader label="tEPA" column={column} />
				),
				footer: (info) => info.column.id,
			}),
			columnHelper.accessor("endgame_total", {
				cell: (info) => (
					<div className="w-20 text-right">
						<NumberDisplay value={info.getValue()} />
					</div>
				),
				header: ({ column }) => (
					<SortableHeader label="eEPA" column={column} />
				),
				footer: (info) => info.column.id,
			}),
		],
	}),
	columnHelper.group({
		header: "Game Piece",
		footer: (props) => props.column.id,
		columns: [
			columnHelper.accessor("coral_total", {
				cell: (info) => (
					<div className="w-20 text-right">
						<NumberDisplay value={info.getValue()} />
					</div>
				),
				header: ({ column }) => (
					<SortableHeader label="coralEPA" column={column} />
				),
				footer: (info) => info.column.id,
			}),
			columnHelper.accessor("algae_total", {
				cell: (info) => (
					<div className="w-20 text-right">
						<NumberDisplay value={info.getValue()} />
					</div>
				),
				header: ({ column }) => (
					<SortableHeader label="algaeEPA" column={column} />
				),
				footer: (info) => info.column.id,
			}),
		],
	}),
	columnHelper.accessor("total_score", {
		cell: (info) => (
			<div className="w-20 text-right">
				<NumberDisplay value={info.getValue()} />
			</div>
		),
		header: ({ column }) => <SortableHeader label="EPA" column={column} />,
		footer: (info) => info.column.id,
	}),
];

const AdvancedDataTableClient = ({
	advancedData,
}: {
	advancedData: AdvancedTeamData[];
}) => {
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([]);

	const table = useReactTable({
		data: advancedData,
		columns,
		state: {
			columnFilters,
			sorting,
		},
		onColumnFiltersChange: setColumnFilters,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return <DataTable table={table} />;
};

export default AdvancedDataTableClient;
