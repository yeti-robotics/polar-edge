import { Card, CardContent } from "@repo/ui/components/card";
import {
  TypographyH1,
  TypographyH2,
  TypographyLabel,
  TypographyMuted,
} from "@repo/ui/components/typography";
import { GitGraphIcon, ShieldCheckIcon, TableIcon, UsersIcon } from "lucide-react";
import { headers } from "next/headers";
import { Suspense } from "react";
import { NavCardGrid } from "@/components/nav-card-grid";
import { StatItem, StatItemSkeleton } from "@/components/stat-item";
import {
  ScoutCoverageSection,
  ScoutCoverageSectionSkeleton,
} from "@/features/analysis/components/ScoutCoverageSection";
import { listAllEvents } from "@/features/analysis/events/queries";
import { getPitFormCount, getStandFormCount, getTeamCount } from "@/features/analysis/queries";
import { EventSwitcher } from "@/features/validation/components/EventSwitcher";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";

const navCards = [
  {
    href: routes.analysis.teams,
    icon: UsersIcon,
    title: "Teams",
    description: "Browse all scouted teams and view detailed per-team breakdowns.",
  },
  {
    href: routes.analysis.comparison,
    icon: GitGraphIcon,
    title: "Comparison",
    description: "Compare multiple teams side-by-side across key performance metrics.",
  },
  {
    href: routes.analysis.scoutCoverage,
    icon: ShieldCheckIcon,
    title: "Scout Coverage",
    description:
      "Spot missing or thinly covered stand forms for a competition using the same coverage grid from validation.",
  },
  {
    href: routes.analysis.events,
    icon: TableIcon,
    title: "Events",
    description:
      "Ranked table of all teams at the event so that I can identify underrated teams that other alliances might overlook.",
  },
];

// ── Async stat components ─────────────────────────────────────────────────────

async function TeamCountStat() {
  const count = await getTeamCount();
  return <StatItem label="Teams" value={count} />;
}

async function StandFormCountStat() {
  const count = await getStandFormCount();
  return <StatItem label="Stand Forms" value={count} />;
}

async function PitFormCountStat() {
  const count = await getPitFormCount();
  return <StatItem label="Pit Forms" value={count} />;
}

export default function AnalysisPage() {
  return (
    <div className="space-y-8">
      <div>
        <TypographyH1 className="mb-1">Scouting Data</TypographyH1>
        <TypographyMuted>Match and team data collected across all events.</TypographyMuted>
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
