import { Skeleton } from "@repo/ui/components/skeleton";
import { ScoutCoverageGrid } from "@/features/validation/components/ScoutCoverageGrid";
import { getScoutCoverage } from "@/features/validation/queries";

export async function ScoutCoverageSection({
  eventId,
}: {
  eventId: string;
}) {
  const rows = await getScoutCoverage(eventId);
  return <ScoutCoverageGrid rows={rows} />;
}

export function ScoutCoverageSectionSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />;
}
