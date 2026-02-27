"use client";

import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
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
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { routes } from "@/lib/routes";
import { MainEventOverviewRow } from "./actions";

type SortKey =
  | "teamNumber"
  | "teamName"
  | "avgAutoPoints"
  | "avgTeleopPoints"
  | "avgClimbPoints"
  | "avgTotalPoints"
  | "uptimePct"
  | "matchesScouted"
  | "overallScore";

function SortingButton({
  label,
  active,
  dir,
  onClick,
  right = false,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  right?: boolean;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ${right ? "ml-auto" : ""}`}
    >
      <span>{label}</span>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export function EventOverviewTableClient({ rows }: { rows: MainEventOverviewRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("overallScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [minMatches, setMinMatches] = useState("3");
  const [maxMatches, setMaxMatches] = useState("");
  const [drivetrainFilter, setDrivetrainFilter] = useState("all");
  const [climbFilter, setClimbFilter] = useState("all");

  const drivetrainOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.drivetrainType ?? "unknown"))).sort(),
    [rows]
  );
  const climbOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.climbType ?? "unknown"))).sort(),
    [rows]
  );

  const visibleRows = useMemo(() => {
    const minVal = minMatches === "" ? 0 : Math.max(Number(minMatches) || 0, 0);
    const maxVal =
      maxMatches === "" ? Number.POSITIVE_INFINITY : Math.max(Number(maxMatches) || 0, 0);

    const filtered = rows.filter((row) => {
      if (row.matchesScouted < minVal) return false;
      if (row.matchesScouted > maxVal) return false;

      const drivetrain = row.drivetrainType ?? "unknown";
      if (drivetrainFilter !== "all" && drivetrain !== drivetrainFilter) return false;

      const climb = row.climbType ?? "unknown";
      if (climbFilter !== "all" && climb !== climbFilter) return false;

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortKey === "teamName") {
        const aName = a.teamName ?? "";
        const bName = b.teamName ?? "";
        return sortDir === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName);
      }

      const aValue =
        sortKey === "teamNumber"
          ? a.teamNumber
          : sortKey === "avgAutoPoints"
            ? a.avgAutoPoints
            : sortKey === "avgTeleopPoints"
              ? a.avgTeleopPoints
              : sortKey === "avgClimbPoints"
                ? a.avgClimbPoints
                : sortKey === "avgTotalPoints"
                  ? a.avgTotalPoints
                  : sortKey === "uptimePct"
                    ? a.uptimePct
                    : sortKey === "matchesScouted"
                      ? a.matchesScouted
                      : a.overallScore;

      const bValue =
        sortKey === "teamNumber"
          ? b.teamNumber
          : sortKey === "avgAutoPoints"
            ? b.avgAutoPoints
            : sortKey === "avgTeleopPoints"
              ? b.avgTeleopPoints
              : sortKey === "avgClimbPoints"
                ? b.avgClimbPoints
                : sortKey === "avgTotalPoints"
                  ? b.avgTotalPoints
                  : sortKey === "uptimePct"
                    ? b.uptimePct
                    : sortKey === "matchesScouted"
                      ? b.matchesScouted
                      : b.overallScore;

      return sortDir === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [rows, minMatches, maxMatches, drivetrainFilter, climbFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "teamName" ? "asc" : "desc");
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No teams found for this event.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="min-matches">Min matches scouted</Label>
            <Input
              id="min-matches"
              type="number"
              min={0}
              value={minMatches}
              onChange={(e) => setMinMatches(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max-matches">Max matches scouted</Label>
            <Input
              id="max-matches"
              type="number"
              min={0}
              placeholder="No max"
              value={maxMatches}
              onChange={(e) => setMaxMatches(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Drivetrain type</Label>
            <Select value={drivetrainFilter} onValueChange={setDrivetrainFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All drivetrains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All drivetrains</SelectItem>
                {drivetrainOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "unknown" ? "Unknown" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Climb capability</Label>
            <Select value={climbFilter} onValueChange={setClimbFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All climb types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All climb types</SelectItem>
                {climbOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "unknown" ? "Unknown" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {visibleRows.length} of {rows.length} teams
      </p>

      <div className="space-y-3 md:hidden">
        {visibleRows.map((row) => (
          <div key={row.teamNumber} className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <Link
                href={routes.analysis.team(row.teamNumber)}
                className="font-mono text-primary hover:underline"
              >
                Team {row.teamNumber}
              </Link>
              <span className="text-xs text-muted-foreground">
                Rank #{row.overallRank} ({row.overallScore.toFixed(1)})
              </span>
            </div>
            <p className="mb-2 text-sm">{row.teamName || "No team name"}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <span className="text-muted-foreground">Auto</span>
              <span className="text-right tabular-nums">{row.avgAutoPoints.toFixed(1)}</span>
              <span className="text-muted-foreground">Teleop</span>
              <span className="text-right tabular-nums">{row.avgTeleopPoints.toFixed(1)}</span>
              <span className="text-muted-foreground">Climb</span>
              <span className="text-right tabular-nums">{row.avgClimbPoints.toFixed(1)}</span>
              <span className="text-muted-foreground">Total</span>
              <span className="text-right tabular-nums">{row.avgTotalPoints.toFixed(1)}</span>
              <span className="text-muted-foreground">Uptime</span>
              <span className="text-right tabular-nums">{row.uptimePct.toFixed(1)}%</span>
              <span className="text-muted-foreground">Matches</span>
              <span className="text-right tabular-nums">{row.matchesScouted}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden rounded-lg border md:block">
        <div className="overflow-x-auto">
          <Table className="min-w-275">
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortingButton
                    label="Team #"
                    active={sortKey === "teamNumber"}
                    dir={sortDir}
                    onClick={() => handleSort("teamNumber")}
                  />
                </TableHead>
                <TableHead>
                  <SortingButton
                    label="Team Name"
                    active={sortKey === "teamName"}
                    dir={sortDir}
                    onClick={() => handleSort("teamName")}
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortingButton
                    label="Avg Auto"
                    active={sortKey === "avgAutoPoints"}
                    dir={sortDir}
                    onClick={() => handleSort("avgAutoPoints")}
                    right
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortingButton
                    label="Avg Teleop"
                    active={sortKey === "avgTeleopPoints"}
                    dir={sortDir}
                    onClick={() => handleSort("avgTeleopPoints")}
                    right
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortingButton
                    label="Avg Climb"
                    active={sortKey === "avgClimbPoints"}
                    dir={sortDir}
                    onClick={() => handleSort("avgClimbPoints")}
                    right
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortingButton
                    label="Avg Total"
                    active={sortKey === "avgTotalPoints"}
                    dir={sortDir}
                    onClick={() => handleSort("avgTotalPoints")}
                    right
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortingButton
                    label="Uptime %"
                    active={sortKey === "uptimePct"}
                    dir={sortDir}
                    onClick={() => handleSort("uptimePct")}
                    right
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortingButton
                    label="Matches"
                    active={sortKey === "matchesScouted"}
                    dir={sortDir}
                    onClick={() => handleSort("matchesScouted")}
                    right
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortingButton
                    label="Overall Rank"
                    active={sortKey === "overallScore"}
                    dir={sortDir}
                    onClick={() => handleSort("overallScore")}
                    right
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={row.teamNumber}>
                  <TableCell className="font-mono">
                    <Link
                      href={routes.analysis.team(row.teamNumber)}
                      className="text-primary hover:underline"
                    >
                      {row.teamNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{row.teamName || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.avgAutoPoints.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.avgTeleopPoints.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.avgClimbPoints.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.avgTotalPoints.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.uptimePct.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.matchesScouted}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    #{row.overallRank} ({row.overallScore.toFixed(1)})
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {visibleRows.length === 0 && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          No teams match the filter that are selected.
        </div>
      )}
    </div>
  );
}
