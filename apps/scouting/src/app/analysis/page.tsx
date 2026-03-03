import {
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { GitGraphIcon, Table, TableIcon, UsersIcon } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { NavCardGrid } from "@/components/nav-card-grid";
import { StatItem, StatItemSkeleton } from "@/components/stat-item";
import { getPitFormCount, getStandFormCount, getTeamCount } from "@/features/analysis/queries";
import { getTeams } from "@/features/scouting/auto-path/actions";
import ExportButton from "./ExportButton";

const navCards = [
  {
    href: "/analysis/teams",
    icon: UsersIcon,
    title: "Teams",
    description: "Browse all scouted teams and view detailed per-team breakdowns.",
  },
  {
    href: "/analysis/comparison",
    icon: GitGraphIcon,
    title: "Comparison",
    description: "Compare multiple teams side-by-side across key performance metrics.",
  },
  {
    href: "/analysis/events",
    icon: TableIcon,
    title: "Events",
    description:
      "Ranked table of all teams at the event so that I can identify underrated teams that other alliances might overlook.",
  },
];

// ── Async stat components ─────────────────────────────────────────────────────

async function TeamCountStat() {
  await connection();
  const count = await getTeamCount();
  return <StatItem label="Teams" value={count} />;
}

async function StandFormCountStat() {
  await connection();
  const count = await getStandFormCount();
  return <StatItem label="Stand Forms" value={count} />;
}

async function PitFormCountStat() {
  await connection();
  const count = await getPitFormCount();
  return <StatItem label="Pit Forms" value={count} />;
}

export default async function AnalysisPage() {
  const teams = await getTeams();
  return (
    <div className="space-y-8">
      <div>
        <TypographyH1 className="mb-1">Scouting Data</TypographyH1>
        <TypographyMuted>Match and team data collected across all events.</TypographyMuted>
        <ExportButton teams={teams} eventName="states" />
      </div>

      <div className="rounded-xl border bg-muted/20 grid grid-cols-1 max-md:divide-y md:grid-cols-3">
        <div className="px-6 py-5 md:border-r">
          <Suspense fallback={<StatItemSkeleton />}>
            <TeamCountStat />
          </Suspense>
        </div>
        <div className="px-6 py-5 md:border-r">
          <Suspense fallback={<StatItemSkeleton />}>
            <StandFormCountStat />
          </Suspense>
        </div>
        <div className="px-6 py-5">
          <Suspense fallback={<StatItemSkeleton />}>
            <PitFormCountStat />
          </Suspense>
        </div>
      </div>

      <NavCardGrid items={navCards} />
    </div>
  );
}
function OverviewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-mono tracking-tight">Analysis Overview</h1>
      {/* <Skeleton /> ///  use later when data is showing */}
      <p className="text-muted-foreground ">
        <Table></Table>
      </p>
    </div>
  );
}

function TableData() {
  return (
    <Table>
      <TableCaption> YeTi </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-25"> MOCK </TableHead>
          <TableHead>MOCK </TableHead>
          <TableHead>MOCK </TableHead>
          <TableHead className="text-right">MOCK </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">MOCK </TableCell>
          <TableCell>MOCK </TableCell>
          <TableCell>MOCK </TableCell>
          <TableCell className="text-right">MOCK </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
