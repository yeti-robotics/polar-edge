import { Skeleton } from "@repo/ui/components/skeleton";

export function TeamsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>

      <div className="rounded-lg border divide-y overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-14 shrink-0" />
            <Skeleton className="h-4 flex-1 max-w-64" />
          </div>
        ))}
      </div>
    </div>
  );
}
