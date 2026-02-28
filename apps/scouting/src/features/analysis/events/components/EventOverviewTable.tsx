"use client";

import { Input } from "@repo/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { cn } from "@repo/ui/lib/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  Header,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { routes } from "@/lib/routes";
import type { TeamEventOverviewRow } from "../types";

const columnHelper = createColumnHelper<TeamEventOverviewRow>();

const columns = [
  columnHelper.accessor("teamNumber", {
    header: "Team #",
    sortDescFirst: false,
    cell: ({ getValue }) => (
      <Link
        href={routes.analysis.team(getValue())}
        className="font-mono text-primary hover:underline"
      >
        {getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("teamName", {
    header: "Team Name",
    cell: ({ getValue }) => getValue() ?? "—",
  }),
  columnHelper.accessor("avgAutoPoints", {
    header: "Avg Auto",
    cell: ({ getValue }) => <span className="tabular-nums">{getValue().toFixed(1)}</span>,
    meta: { align: "right" },
    enableGlobalFilter: false,
  }),
  columnHelper.accessor("avgTeleopPoints", {
    header: "Avg Teleop",
    cell: ({ getValue }) => <span className="tabular-nums">{getValue().toFixed(1)}</span>,
    meta: { align: "right" },
    enableGlobalFilter: false,
  }),
  columnHelper.accessor("avgClimbPoints", {
    header: "Avg Climb",
    cell: ({ getValue }) => <span className="tabular-nums">{getValue().toFixed(1)}</span>,
    meta: { align: "right" },
    enableGlobalFilter: false,
  }),
  columnHelper.accessor("avgTotalPoints", {
    header: "Avg Total",
    cell: ({ getValue }) => <span className="tabular-nums">{getValue().toFixed(1)}</span>,
    meta: { align: "right" },
    enableGlobalFilter: false,
  }),
  columnHelper.accessor("uptimePct", {
    header: "Uptime %",
    cell: ({ getValue }) => <span className="tabular-nums">{getValue().toFixed(1)}%</span>,
    meta: { align: "right" },
    enableGlobalFilter: false,
  }),
  columnHelper.accessor("matchesScouted", {
    header: "Matches",
    cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
    meta: { align: "right" },
    enableGlobalFilter: false,
  }),
  columnHelper.accessor("overallRank", {
    id: "overallRank",
    header: "Overall Rank",
    sortDescFirst: false,
    cell: ({ row }) => (
      <span className="tabular-nums">
        #{row.original.overallRank} ({row.original.overallScore.toFixed(1)})
      </span>
    ),
    meta: { align: "right" },
    enableGlobalFilter: false,
  }),
];

function SortingButton({ header }: { header: Header<TeamEventOverviewRow, unknown> }) {
  const Icon =
    header.column.getIsSorted() === "asc"
      ? ChevronUpIcon
      : header.column.getIsSorted() === "desc"
        ? ChevronDownIcon
        : ChevronsUpDownIcon;

  return (
    <button
      type="button"
      className={cn(
        "flex gap-1 items-center",
        header.column.getCanSort() && "cursor-pointer select-none"
      )}
      onClick={header.column.getToggleSortingHandler()}
      title={
        header.column.getCanSort()
          ? header.column.getNextSortingOrder() === "asc"
            ? "Sort ascending"
            : header.column.getNextSortingOrder() === "desc"
              ? "Sort descending"
              : "Clear sort"
          : undefined
      }
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      <Icon className="size-4" />
    </button>
  );
}

export function EventOverviewTable({ rows }: { rows: TeamEventOverviewRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Filter teams"
        value={table.getState().globalFilter ?? ""}
        onChange={(e) => table.setGlobalFilter(String(e.target.value))}
      />
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <SortingButton header={header} />
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              className={cn(
                row.getIsSelected() && "bg-muted",
                "hover:bg-primary/40 even:bg-muted/50"
              )}
              key={row.id}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
