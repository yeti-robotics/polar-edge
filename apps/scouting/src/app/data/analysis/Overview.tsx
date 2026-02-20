"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode, useMemo, useState } from "react";
import type { AnalysisTeamRow } from "./actions";

interface OverviewProps {
  teams: AnalysisTeamRow[];
}

function toTitleCase(value: string): string {
  if (!value || value === "unknown") {
    return "Unknown";
  }
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatNumber(value: number): string {
  return value.toFixed(1);
}

function SortHeader({ label, onClick }: { label: string; onClick: () => void }): ReactNode {
  return (
    <Button variant="ghost" className="-ml-2 h-8 px-2" onClick={onClick}>
      {label}
      <ArrowUpDown className="ml-2 size-4" />
    </Button>
  );
}

function TeamRowExpansion({ row }: { row: AnalysisTeamRow }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Pit Data</CardTitle>
          <CardDescription>Latest pit form details for Team {row.teamNumber}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Drivetrain</span>
            <span>{toTitleCase(row.drivetrain)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Climb capability</span>
            <span>{toTitleCase(row.climbType)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Capacity</span>
            <span>{row.capacity}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Weight</span>
            <span>{row.weight}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reliability</CardTitle>
          <CardDescription>Scouting confidence and availability details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Uptime</span>
            <span>{formatNumber(row.uptimePct)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Consistency</span>
            <span>{formatNumber(row.consistencyScore)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Matches scouted</span>
            <span>
              {row.matchesScouted} / {row.scheduledMatches}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={row.canTrench ? "default" : "outline"}>Trench</Badge>
            <Badge variant={row.canBump ? "default" : "outline"}>Bump</Badge>
            <Badge variant={row.canShuttle ? "default" : "outline"}>Shuttle</Badge>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/data/teams/${row.teamNumber}`}>
              Open Team Page
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Overview({ teams }: OverviewProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "overallScore", desc: true }]);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [minMatches, setMinMatches] = useState<string>("3");
  const [maxMatches, setMaxMatches] = useState<string>("");
  const [drivetrain, setDrivetrain] = useState<string>("all");
  const [climbType, setClimbType] = useState<string>("all");

  const drivetrainOptions = useMemo(
    () => [
      "all",
      ...Array.from(new Set(teams.map((team) => team.drivetrain))).sort((a, b) =>
        a.localeCompare(b)
      ),
    ],
    [teams]
  );

  const climbOptions = useMemo(
    () => [
      "all",
      ...Array.from(new Set(teams.map((team) => team.climbType))).sort((a, b) =>
        a.localeCompare(b)
      ),
    ],
    [teams]
  );

  const filteredTeams = useMemo(() => {
    const min = minMatches.trim() === "" ? 0 : Number(minMatches);
    const max = maxMatches.trim() === "" ? Number.POSITIVE_INFINITY : Number(maxMatches);

    return teams.filter((team) => {
      if (Number.isFinite(min) && team.matchesScouted < min) {
        return false;
      }
      if (Number.isFinite(max) && team.matchesScouted > max) {
        return false;
      }
      if (drivetrain !== "all" && team.drivetrain !== drivetrain) {
        return false;
      }
      if (climbType !== "all" && team.climbType !== climbType) {
        return false;
      }
      return true;
    });
  }, [teams, minMatches, maxMatches, drivetrain, climbType]);

  const columns = useMemo<ColumnDef<AnalysisTeamRow>[]>(
    () => [
      {
        id: "expand",
        enableSorting: false,
        header: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => {
              const teamNumber = row.original.teamNumber;
              setExpandedTeam(expandedTeam === teamNumber ? null : teamNumber);
            }}
            aria-label={`Expand team ${row.original.teamNumber}`}
          >
            <ChevronDown
              className={`size-4 transition-transform ${
                expandedTeam === row.original.teamNumber ? "rotate-180" : ""
              }`}
            />
          </Button>
        ),
      },
      {
        accessorKey: "teamNumber",
        header: ({ column }) => (
          <SortHeader
            label="Team #"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <Link
            className="font-medium text-primary hover:underline"
            href={`/data/teams/${row.original.teamNumber}`}
          >
            {row.original.teamNumber}
          </Link>
        ),
      },
      {
        accessorKey: "teamName",
        header: ({ column }) => (
          <SortHeader
            label="Team name"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
      },
      {
        accessorKey: "avgAutoPoints",
        header: ({ column }) => (
          <SortHeader
            label="Avg auto"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatNumber(row.original.avgAutoPoints)}</span>
        ),
      },
      {
        accessorKey: "avgTeleopPoints",
        header: ({ column }) => (
          <SortHeader
            label="Avg teleop"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatNumber(row.original.avgTeleopPoints)}</span>
        ),
      },
      {
        accessorKey: "avgClimbPoints",
        header: ({ column }) => (
          <SortHeader
            label="Avg climb"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatNumber(row.original.avgClimbPoints)}</span>
        ),
      },
      {
        accessorKey: "avgTotalPoints",
        header: ({ column }) => (
          <SortHeader
            label="Avg total"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatNumber(row.original.avgTotalPoints)}</span>
        ),
      },
      {
        accessorKey: "uptimePct",
        header: ({ column }) => (
          <SortHeader
            label="Uptime %"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{formatNumber(row.original.uptimePct)}%</span>
        ),
      },
      {
        accessorKey: "matchesScouted",
        header: ({ column }) => (
          <SortHeader
            label="Matches"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
      },
      {
        accessorKey: "overallScore",
        header: ({ column }) => (
          <SortHeader
            label="Overall rank"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">#{row.original.overallRank}</Badge>
            <span className="tabular-nums">{formatNumber(row.original.overallScore)}</span>
          </div>
        ),
      },
    ],
    [expandedTeam]
  );

  const table = useReactTable({
    data: filteredTeams,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <label htmlFor="min-matches" className="text-xs uppercase text-muted-foreground">
            Min matches
          </label>
          <Input
            id="min-matches"
            inputMode="numeric"
            type="number"
            min={0}
            value={minMatches}
            onChange={(event) => setMinMatches(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="max-matches" className="text-xs uppercase text-muted-foreground">
            Max matches
          </label>
          <Input
            id="max-matches"
            inputMode="numeric"
            type="number"
            min={0}
            value={maxMatches}
            onChange={(event) => setMaxMatches(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase text-muted-foreground">Drivetrain</p>
          <Select value={drivetrain} onValueChange={setDrivetrain}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {drivetrainOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All" : toTitleCase(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase text-muted-foreground">Climb capability</p>
          <Select value={climbType} onValueChange={setClimbType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {climbOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All" : toTitleCase(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => {
                const isExpanded = expandedTeam === row.original.teamNumber;
                return (
                  <Fragment key={row.id}>
                    <TableRow>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="bg-muted/20">
                          <TeamRowExpansion row={row.original} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No teams match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
