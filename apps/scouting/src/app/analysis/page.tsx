import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyLabel, TypographyMuted } from "@repo/ui/components/typography";
import { countDistinct, isNull } from "drizzle-orm";
import { ChevronRightIcon, TableIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/database";
import { pitForm, standForm, team } from "@/lib/database/schema/tables";

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

async function AnalysisStats() {
  const [teamsResult, standFormsResult, pitFormsResult] = await Promise.all([
    db.select({ count: countDistinct(team.teamNumber) }).from(team),
    db
      .select({ count: countDistinct(standForm.id) })
      .from(standForm)
      .where(isNull(standForm.deletedAt)),
    db.select({ count: countDistinct(pitForm.id) }).from(pitForm),
  ]);

  const teamCount = teamsResult[0]?.count ?? 0;
  const standFormCount = standFormsResult[0]?.count ?? 0;
  const pitFormCount = pitFormsResult[0]?.count ?? 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card>
        <CardContent className="pt-5 pb-4">
          <TypographyLabel className="mb-1">Teams</TypographyLabel>
          <p className="text-3xl font-semibold tabular-nums">{teamCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 pb-4">
          <TypographyLabel className="mb-1">Stand Forms</TypographyLabel>
          <p className="text-3xl font-semibold tabular-nums">{standFormCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5 pb-4">
          <TypographyLabel className="mb-1">Pit Forms</TypographyLabel>
          <p className="text-3xl font-semibold tabular-nums">{pitFormCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {["a", "b", "c"].map((k) => (
        <Card key={k}>
          <CardContent className="pt-5 pb-4">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-8 w-10" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <div className="space-y-8">
      <div>
        <TypographyH1 className="mb-1">Scouting Data</TypographyH1>
        <TypographyMuted>Match and team data collected across all events.</TypographyMuted>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <AnalysisStats />
      </Suspense>

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
