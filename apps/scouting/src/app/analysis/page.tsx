import {
  TypographyH1,
  TypographyH2,
  TypographyMuted,
  TypographyP,
} from "@repo/ui/components/typography";
import {
  GitGraphIcon,
  ShieldCheckIcon,
  TableIcon,
  UsersIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { NavCardGrid } from "@/components/nav-card-grid";
import { StatItem, StatItemSkeleton } from "@/components/stat-item";

// Temporary placeholder for UserFormSubmissions. The original component
// appears to have been moved or removed; provide a minimal inline
// implementation so the analysis page compiles. Replace with the real
// implementation when available.
function UserFormSubmissions({
  memberId,
  title,
  emptyLabel,
  isAdmin
}: {
  memberId?: string;
  title?: string;
  emptyLabel?: string;
  isAdmin?: boolean;
}) {
  return (
    <section className="rounded-xl border bg-muted/20 px-6 py-5">
      <TypographyH2>{title ?? "Your Submissions"}</TypographyH2>
      {memberId && (
        <TypographyP className="mt-2 text-xs text-muted-foreground">
          Member: {memberId}
        </TypographyP>
      )}
      <TypographyP className="mt-2 text-sm text-muted-foreground">
        {emptyLabel ?? "No forms submitted yet."}
      </TypographyP>
      { isAdmin && (
        <TypographyP className="mt-2 text-sm text-muted-foreground">
          Admin

        </TypographyP>
      )}
    </section>
  );
}

import {
  getPitFormCount,
  getStandFormCount,
  getTeamCount,
} from "@/features/analysis/queries";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";

const navCards = [
  {
    href: routes.analysis.teams,
    icon: UsersIcon,
    title: "Teams",
    description:
      "Browse all scouted teams and view detailed per-team breakdowns.",
  },
  {
    href: routes.analysis.comparison,
    icon: GitGraphIcon,
    title: "Comparison",
    description:
      "Compare multiple teams side-by-side across key performance metrics.",
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

async function UserSubmissionsSection() {
  let activeMember = null;
  try { 
    activeMember = await auth.api.getActiveMember({ headers: await headers() });
  } catch {
    activeMember = null;
  }

  if (!activeMember) {
    return (
      <section className="rounded-xl border bg-muted/20 px-6 py-5">
        <TypographyH2> Your Submissions</TypographyH2>
        <TypographyP>Sign in to see the forms you have submitted. </TypographyP>
      </section>
    );
  }

  return (
    <UserFormSubmissions
    isAdmin={activeMember?.role === "admin" || activeMember?.role === "owner"}
      memberId={activeMember.id}
      title="Your Submissions"
      emptyLabel="No forms submitted yet."
    />
  );
}

export default function AnalysisPage() {
  return (
    <div className="space-y-8">
      <div>
        <TypographyH1 className="mb-1">Scouting Data</TypographyH1>
        <TypographyMuted>
          Match and team data collected across all events
        </TypographyMuted>
      </div>

      <Suspense
        fallback={<div className="rounded-xl border bg-muted/20 px-6 py-5" />}
      >
        <UserSubmissionsSection />
      </Suspense>

      <div>
        <TypographyH2>All Time</TypographyH2>
        <TypographyP> Organization-wide across all</TypographyP>
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
      <TypographyH1> c</TypographyH1>
    </div>
  );
}
