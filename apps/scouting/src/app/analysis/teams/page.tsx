import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyH1, TypographyMuted } from "@repo/ui/components/typography";
import { Suspense } from "react";
import { TeamSearchWrapper } from "@/features/analysis/components/TeamSearchWrapper";
import { TeamsList } from "@/features/analysis/components/TeamsList";
import { TeamsListSkeleton } from "@/features/analysis/components/TeamsListSkeleton";

interface TeamsPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default function TeamsPage({ searchParams }: TeamsPageProps) {
  return (
    <div className="space-y-6">
      {/* Static shell — zero blocking, served from edge instantly */}
      <div>
        <TypographyH1>Teams</TypographyH1>
        <TypographyMuted className="mt-1">Browse all teams in the database</TypographyMuted>
      </div>

      {/* Search input — client component, reads searchParams via useSearchParams */}
      <div className="w-full max-w-md">
        <Suspense fallback={<Skeleton className="h-9 w-full rounded-lg" />}>
          <TeamSearchWrapper />
        </Suspense>
      </div>

      {/* Team list + pagination — streams in, result is cached per (page, search) */}
      <Suspense fallback={<TeamsListSkeleton />}>
        <TeamsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
