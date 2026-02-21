import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyLabel, TypographyMuted } from "@repo/ui/components/typography";
import { ChevronRightIcon, TableIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getPitFormCount, getStandFormCount, getTeamCount } from "./queries";

const navCards = [
  {
    href: "/analysis/teams",
    icon: UsersIcon,
    title: "Teams",
    description: "Browse all scouted teams and view detailed per-team breakdowns.",
  },
  {
    href: "/analysis/comparison",
    icon: TableIcon,
    title: "Comparison",
    description: "Compare multiple teams side-by-side across key performance metrics.",
  },
];

// ── Presentation ──────────────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground font-mono mb-2.5">
        {label}
      </p>
      <p className="text-4xl tabular-nums leading-none tracking-normal mb-3">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function StatItemSkeleton() {
  return (
    <div>
      <Skeleton className="h-2.5 w-16 mb-2.5" />
      <Skeleton className="h-11 w-20 mb-3" />
      <Skeleton className="h-0.5 w-8" />
    </div>
  );
}

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

export default function AnalysisPage() {
  return (
    <div className="space-y-8">
      <div>
        <TypographyH1 className="mb-1">Scouting Data</TypographyH1>
        <TypographyMuted>Match and team data collected across all events.</TypographyMuted>
      </div>

      <div className="rounded-xl border bg-muted/20 grid grid-cols-1 max-md:divide-y md:grid-cols-3">
        <div className="px-6 py-5 border-r">
          <Suspense fallback={<StatItemSkeleton />}>
            <TeamCountStat />
          </Suspense>
        </div>
        <div className="px-6 py-5 border-r">
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

      <div>
        <TypographyLabel className="mb-3">Quick Access</TypographyLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {navCards.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      <CardTitle className="text-base">{title}</CardTitle>
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
