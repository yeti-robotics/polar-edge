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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/ui/components/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { RotateCcwIcon, ShuffleIcon, TrophyIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { isAllianceComplete, simulateAlliances } from "../logic";
import type { AllianceSlot, SimResult, SimTeam } from "../types";

type Props = {
  teams: SimTeam[];
};

export function AllianceSimulator({ teams }: Props) {
  const [alliance1, setAlliance1] = useState<AllianceSlot[]>([null, null, null]);
  const [alliance2, setAlliance2] = useState<AllianceSlot[]>([null, null, null]);

  const selectedTeamNumbers = useMemo(() => {
    const nums = new Set<number>();
    for (const t of [...alliance1, ...alliance2]) {
      if (t) nums.add(t.teamNumber);
    }
    return nums;
  }, [alliance1, alliance2]);

  const availableTeams = useMemo(
    () => teams.filter((t) => !selectedTeamNumbers.has(t.teamNumber)),
    [teams, selectedTeamNumbers]
  );

  const simResult: SimResult | null = useMemo(() => {
    if (isAllianceComplete(alliance1) && isAllianceComplete(alliance2)) {
      return simulateAlliances(alliance1, alliance2);
    }
    return null;
  }, [alliance1, alliance2]);

  function setTeam(allianceIdx: 1 | 2, slotIdx: number, teamNumber: string | null) {
    const team = teamNumber
      ? (teams.find((t) => String(t.teamNumber) === teamNumber) ?? null)
      : null;
    const setter = allianceIdx === 1 ? setAlliance1 : setAlliance2;
    setter((prev) => {
      const next = [...prev];
      next[slotIdx] = team;
      return next;
    });
  }

  function removeTeam(allianceIdx: 1 | 2, slotIdx: number) {
    setTeam(allianceIdx, slotIdx, null);
  }

  function resetAll() {
    setAlliance1([null, null, null]);
    setAlliance2([null, null, null]);
  }

  function randomize() {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    setAlliance1([shuffled[0] ?? null, shuffled[1] ?? null, shuffled[2] ?? null]);
    setAlliance2([shuffled[3] ?? null, shuffled[4] ?? null, shuffled[5] ?? null]);
  }

  const positionLabels = ["Captain", "First Pick", "Second Pick"];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={randomize}>
          <ShuffleIcon className="mr-2 size-4" />
          Random
        </Button>
        <Button variant="outline" size="sm" onClick={resetAll}>
          <RotateCcwIcon className="mr-2 size-4" />
          Reset
        </Button>
      </div>

      {/* Alliance Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <AllianceCard
          title="Alliance 1"
          color="blue"
          alliance={alliance1}
          positionLabels={positionLabels}
          availableTeams={availableTeams}
          onSelectTeam={(slot, teamNum) => setTeam(1, slot, teamNum)}
          onRemoveTeam={(slot) => removeTeam(1, slot)}
        />
        <AllianceCard
          title="Alliance 2"
          color="red"
          alliance={alliance2}
          positionLabels={positionLabels}
          availableTeams={availableTeams}
          onSelectTeam={(slot, teamNum) => setTeam(2, slot, teamNum)}
          onRemoveTeam={(slot) => removeTeam(2, slot)}
        />
      </div>

      {/* Simulation Results */}
      {simResult && (
        <SimulationResults
          result={simResult}
          alliance1={alliance1 as [SimTeam, SimTeam, SimTeam]}
          alliance2={alliance2 as [SimTeam, SimTeam, SimTeam]}
        />
      )}

      {!simResult && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Select 3 teams for each alliance to simulate a match.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AllianceCard({
  title,
  color,
  alliance,
  positionLabels,
  availableTeams,
  onSelectTeam,
  onRemoveTeam,
}: {
  title: string;
  color: "blue" | "red";
  alliance: AllianceSlot[];
  positionLabels: string[];
  availableTeams: SimTeam[];
  onSelectTeam: (slotIdx: number, teamNumber: string) => void;
  onRemoveTeam: (slotIdx: number) => void;
}) {
  const borderColor = color === "blue" ? "border-blue-500/50" : "border-red-500/50";
  const headerBg = color === "blue" ? "bg-blue-500/10" : "bg-red-500/10";

  return (
    <Card className={borderColor}>
      <CardHeader className={headerBg}>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Select 3 teams for this alliance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {alliance.map((team, idx) => (
          <div key={idx} className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium">{positionLabels[idx]}</span>
            {team ? (
              <div className="bg-muted flex items-center justify-between rounded-md px-3 py-2">
                <div>
                  <span className="font-mono font-semibold">{team.teamNumber}</span>
                  <span className="text-muted-foreground ml-2 text-sm">{team.teamName}</span>
                </div>
                <Button variant="ghost" size="icon-xs" onClick={() => onRemoveTeam(idx)}>
                  <XIcon className="size-4" />
                </Button>
              </div>
            ) : (
              <TeamPicker
                teams={availableTeams}
                onSelect={(teamNum) => onSelectTeam(idx, teamNum)}
              />
            )}
          </div>
        ))}

        {/* Alliance Summary */}
        {alliance.some((t) => t !== null) && (
          <div className="border-t pt-3">
            <AllianceSummary alliance={alliance.filter((t): t is SimTeam => t !== null)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamPicker({
  teams,
  onSelect,
}: {
  teams: SimTeam[];
  onSelect: (teamNumber: string) => void;
}) {
  return (
    <Combobox
      value=""
      onValueChange={(v) => {
        if (v) onSelect(v);
      }}
      items={teams}
      itemToStringLabel={(v) => {
        const team = teams.find((t) => String(t.teamNumber) === v);
        return team ? `${team.teamNumber} - ${team.teamName}` : (v ?? "");
      }}
    >
      <ComboboxInput placeholder="Search teams..." />
      <ComboboxContent>
        <ComboboxEmpty>No teams found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.teamNumber} value={String(item.teamNumber)}>
              <span className="font-mono">{item.teamNumber}</span>
              <span className="text-muted-foreground ml-1">{item.teamName}</span>
              <span className="text-muted-foreground ml-auto text-xs">
                {item.avgTotalPoints.toFixed(1)} pts
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function AllianceSummary({ alliance }: { alliance: SimTeam[] }) {
  const totalPoints = alliance.reduce((sum, t) => sum + t.avgTotalPoints, 0);
  const avgUptime = alliance.reduce((sum, t) => sum + t.uptimePct, 0) / alliance.length;
  const avgClimb = alliance.reduce((sum, t) => sum + t.climbSuccessPct, 0) / alliance.length;

  return (
    <div className="grid grid-cols-3 gap-2 text-center text-xs">
      <div>
        <div className="text-muted-foreground">Avg Points</div>
        <div className="font-semibold">{totalPoints.toFixed(1)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Avg Uptime</div>
        <div className="font-semibold">{avgUptime.toFixed(1)}%</div>
      </div>
      <div>
        <div className="text-muted-foreground">Avg Climb</div>
        <div className="font-semibold">{avgClimb.toFixed(1)}%</div>
      </div>
    </div>
  );
}

function SimulationResults({
  result,
  alliance1,
  alliance2,
}: {
  result: SimResult;
  alliance1: [SimTeam, SimTeam, SimTeam];
  alliance2: [SimTeam, SimTeam, SimTeam];
}) {
  const pct1 = Math.round(result.alliance1WinPct * 1000) / 10;
  const pct2 = Math.round(result.alliance2WinPct * 1000) / 10;
  const winner = pct1 > pct2 ? 1 : pct2 > pct1 ? 2 : 0;

  return (
    <div className="space-y-6">
      {/* Win Probability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrophyIcon className="size-5" />
            Simulation Results
          </CardTitle>
          <CardDescription>Win probability based on OpenSkill drive team ratings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 text-right">
              <span className="text-lg font-bold text-blue-500">{pct1}%</span>
            </div>
            <div className="flex-1">
              <div className="flex h-6 overflow-hidden rounded-full">
                <div
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${pct1}%` }}
                />
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${pct2}%` }}
                />
              </div>
            </div>
            <div className="w-24">
              <span className="text-lg font-bold text-red-500">{pct2}%</span>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              Alliance 1{winner === 1 && <Badge variant="secondary">Favored</Badge>}
            </span>
            <span className="flex items-center gap-1">
              {winner === 2 && <Badge variant="secondary">Favored</Badge>}
              Alliance 2
            </span>
          </div>

          {/* Points comparison */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Combined Avg Points</div>
              <div className="text-2xl font-bold text-blue-500">{result.alliance1AvgPoints}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Combined Avg Points</div>
              <div className="text-2xl font-bold text-red-500">{result.alliance2AvgPoints}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Avg Pts</TableHead>
                <TableHead className="text-right">Climb %</TableHead>
                <TableHead className="text-right">Uptime %</TableHead>
                <TableHead className="text-right">Scouted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alliance1.map((team) => (
                <TableRow key={team.teamNumber} className="bg-blue-500/5">
                  <TableCell>
                    <span className="font-mono font-semibold">{team.teamNumber}</span>
                    <span className="text-muted-foreground ml-2 text-sm">{team.teamName}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{team.ordinal.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {team.avgTotalPoints.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {team.climbSuccessPct.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {team.uptimePct.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-mono">{team.matchesScouted}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={6} className="h-1 p-0" />
              </TableRow>
              {alliance2.map((team) => (
                <TableRow key={team.teamNumber} className="bg-red-500/5">
                  <TableCell>
                    <span className="font-mono font-semibold">{team.teamNumber}</span>
                    <span className="text-muted-foreground ml-2 text-sm">{team.teamName}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{team.ordinal.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {team.avgTotalPoints.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {team.climbSuccessPct.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {team.uptimePct.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-mono">{team.matchesScouted}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
