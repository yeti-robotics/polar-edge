<<<<<<< HEAD
import {
  TypographyH1,
  TypographyH2,
  TypographyMuted,
  TypographyP,
} from "@repo/ui/components/typography";
import { GitGraphIcon, TableIcon, UsersIcon } from "lucide-react";
import { headers } from "next/headers";
=======
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { GitGraphIcon, ShieldCheckIcon, TableIcon, UsersIcon } from "lucide-react";
>>>>>>> c2f6d71d5d1d7076eea6db969e4d176fab8d11d6
import { connection } from "next/server";
import { Suspense } from "react";
import { NavCardGrid } from "@/components/nav-card-grid";
import { StatItem, StatItemSkeleton } from "@/components/stat-item";
<<<<<<< HEAD
import { UserFormSubmissions } from "@/features/analysis/components/UserFormSubmissions";
import {
  getPitFormCount,
  getStandFormCount,
  getTeamCount,
} from "@/features/analysis/queries";
import { auth } from "@/lib/auth";
=======
import { getPitFormCount, getStandFormCount, getTeamCount } from "@/features/analysis/queries";
import { routes } from "@/lib/routes";
>>>>>>> c2f6d71d5d1d7076eea6db969e4d176fab8d11d6

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
          {" "}
          Match and team data collected across all events.{" "}
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
