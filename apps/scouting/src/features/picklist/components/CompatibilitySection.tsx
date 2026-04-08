"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion";
import { Badge } from "@repo/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import Link from "next/link";
import type { WorkabilityNote } from "@/features/scouting/workability/types";
import { formatWorkabilityScore, getCoverageLabel } from "@/features/scouting/workability/utils";
import { routes } from "@/lib/routes";
import { CompatibilityNotesDialog } from "./CompatibilityNotesDialog";

interface CompatibleTeam {
  teamNumber: number;
  teamName: string | null;
  avgDriverWorkability: number | null;
  avgHumanPlayerWorkability: number | null;
  compositeCompatibilityScore: number | null;
  avgTotalPoints?: number;
  submissionCount: number;
  noteCount: number;
  compatibilityNotes: WorkabilityNote[];
}

export function CompatibilitySection({ teams }: { teams: CompatibleTeam[] }) {
  const rankedTeams = [...teams]
    .filter((team) => team.compositeCompatibilityScore !== null)
    .sort((a, b) => {
      const scoreDiff =
        (b.compositeCompatibilityScore ?? -1) - (a.compositeCompatibilityScore ?? -1);
      if (scoreDiff !== 0) return scoreDiff;

      const submissionsDiff = b.submissionCount - a.submissionCount;
      if (submissionsDiff !== 0) return submissionsDiff;

      return (b.avgTotalPoints ?? 0) - (a.avgTotalPoints ?? 0);
    });

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="compatibility"
      className="w-full rounded-lg border px-4"
    >
      <AccordionItem value="compatibility" className="border-none">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="text-left">
            <div className="font-semibold">Compatibility</div>
            <p className="text-sm font-normal text-muted-foreground">
              Ranked view of the teams that best fit your alliance from driver and human-player
              feedback.
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-1">
          {rankedTeams.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
              No compatibility ratings yet. Submit driver or human-player workability feedback to
              populate this ranking.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Driver</TableHead>
                    <TableHead className="text-right">Human Player</TableHead>
                    <TableHead className="text-right">Composite</TableHead>
                    <TableHead className="text-right">Avg Pts</TableHead>
                    <TableHead className="text-right">Submissions</TableHead>
                    <TableHead className="text-right">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankedTeams.map((team) => (
                    <TableRow key={team.teamNumber}>
                      <TableCell className="font-mono font-bold">
                        <Link
                          href={routes.analysis.team(team.teamNumber)}
                          className="text-primary hover:underline"
                        >
                          {team.teamNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{team.teamName ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatWorkabilityScore(team.avgDriverWorkability)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatWorkabilityScore(team.avgHumanPlayerWorkability)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatWorkabilityScore(team.compositeCompatibilityScore)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {team.avgTotalPoints !== undefined ? team.avgTotalPoints.toFixed(1) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="tabular-nums">{team.submissionCount}</span>
                          <Badge variant="outline" className="font-normal">
                            {getCoverageLabel(team)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <CompatibilityNotesDialog
                          notes={team.compatibilityNotes}
                          noteCount={team.noteCount}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
