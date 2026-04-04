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
import { useMemo, useState } from "react";
import type { WorkabilityNote } from "@/features/scouting/workability/types";
import { formatWorkabilityScore, getCoverageLabel } from "@/features/scouting/workability/utils";
import { routes } from "@/lib/routes";
import { CompatibilityNotesDialog } from "./CompatibilityNotesDialog";
import { QuickAddTeamButton } from "./QuickAddTeamButton";

interface CellMeta {
  align?: "right";
}

interface TeamWithMetrics {
  teamNumber: number;
  teamName: string | null;
  avgTotalPoints?: number;
  climbSuccessPct?: number;
  uptimePct?: number;
  matchesScouted?: number;
  avgDriverWorkability: number | null;
  avgHumanPlayerWorkability: number | null;
  compositeCompatibilityScore: number | null;
  submissionCount: number;
  noteCount: number;
  compatibilityNotes: WorkabilityNote[];
}

interface TeamsAtEventClientProps {
  teams: TeamWithMetrics[];
  currentPicklistId: string;
  picklistTeams: number[];
  nextRank: number;
}

const columnHelper = createColumnHelper<TeamWithMetrics>();

function SortingButton({ header }: { header: Header<TeamWithMetrics, unknown> }) {
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
        "flex items-center gap-1",
        header.column.getCanSort() && "cursor-pointer select-none"
      )}
      onClick={header.column.getToggleSortingHandler()}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      <Icon className="size-4" />
    </button>
  );
}

export function TeamsAtEventClient({
  teams,
  currentPicklistId,
  picklistTeams,
  nextRank,
}: TeamsAtEventClientProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "compositeCompatibilityScore", desc: true },
  ]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "add",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const inPicklist = picklistTeams.includes(row.original.teamNumber);

          return (
            <div className="inline-flex items-center justify-end">
              {inPicklist ? (
                <span className="text-muted-foreground">Added</span>
              ) : (
                <QuickAddTeamButton
                  picklistId={currentPicklistId}
                  teamNumber={row.original.teamNumber}
                  rank={nextRank}
                />
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("teamNumber", {
        header: "Team",
        sortDescFirst: false,
        cell: ({ getValue }) => (
          <Link
            href={routes.analysis.team(getValue())}
            className="font-mono font-bold text-primary hover:underline"
          >
            {getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("teamName", {
        header: "Name",
        cell: ({ getValue }) => getValue() ?? "—",
      }),
      columnHelper.accessor((row) => row.compositeCompatibilityScore ?? -1, {
        id: "compositeCompatibilityScore",
        header: "Compat",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular-nums font-semibold">
            {formatWorkabilityScore(row.original.compositeCompatibilityScore)}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.avgDriverWorkability ?? -1, {
        id: "avgDriverWorkability",
        header: "Driver",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatWorkabilityScore(row.original.avgDriverWorkability)}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.avgHumanPlayerWorkability ?? -1, {
        id: "avgHumanPlayerWorkability",
        header: "Human Player",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatWorkabilityScore(row.original.avgHumanPlayerWorkability)}
          </span>
        ),
      }),
      columnHelper.accessor("avgTotalPoints", {
        header: "Avg Pts",
        meta: { align: "right" },
        cell: ({ getValue }) => (
          <span className="tabular-nums">
            {getValue() !== undefined ? getValue()!.toFixed(1) : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("climbSuccessPct", {
        header: "Climb %",
        meta: { align: "right" },
        cell: ({ getValue }) => (
          <span className="tabular-nums">
            {getValue() !== undefined ? `${Math.round(getValue()!)}%` : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("uptimePct", {
        header: "Uptime %",
        meta: { align: "right" },
        cell: ({ getValue }) => (
          <span className="tabular-nums">
            {getValue() !== undefined ? `${Math.round(getValue()!)}%` : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("matchesScouted", {
        header: "Matches",
        meta: { align: "right" },
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue() !== undefined ? getValue() : "—"}</span>
        ),
      }),
      columnHelper.accessor("submissionCount", {
        header: "Submissions",
        meta: { align: "right" },
        cell: ({ row }) => (
          <div className="flex flex-col items-end">
            <span className="tabular-nums">{row.original.submissionCount}</span>
            <span className="text-xs text-muted-foreground">{getCoverageLabel(row.original)}</span>
          </div>
        ),
      }),
      columnHelper.display({
        id: "notes",
        header: "Notes",
        enableSorting: false,
        meta: { align: "right" },
        cell: ({ row }) => (
          <CompatibilityNotesDialog
            notes={row.original.compatibilityNotes}
            noteCount={row.original.noteCount}
          />
        ),
      }),
    ],
    [picklistTeams, currentPicklistId, nextRank]
  );

  const table = useReactTable({
    data: teams,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter teams"
        value={globalFilter}
        onChange={(event) => setGlobalFilter(String(event.target.value))}
      />

      <div className="overflow-x-auto">
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
            {table.getRowModel().rows.map((row) => {
              const inPicklist = picklistTeams.includes(row.original.teamNumber);

              return (
                <TableRow
                  key={row.id}
                  data-removed={inPicklist}
                  className="data-[removed=true]:opacity-55 hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        (cell.column.columnDef.meta as CellMeta | undefined)?.align === "right" &&
                          "text-right"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
