import { Skeleton } from "@repo/ui/components/skeleton";

function PodiumSkeleton() {
  return (
    <div className="grid grid-cols-3 items-end gap-1.5">
      {/* silver (2nd) - h-16 step */}
      <div className="flex flex-col items-center gap-2.5">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-8" />
        <div className="h-16 w-full rounded-t-xl border-2 border-t border-x border-muted" />
      </div>
      {/* gold (1st) - h-24 step */}
      <div className="flex flex-col items-center gap-2.5">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-8" />
        <div className="h-24 w-full rounded-t-xl border-2 border-t border-x border-muted" />
      </div>
      {/* bronze (3rd) - h-10 step */}
      <div className="flex flex-col items-center gap-2.5">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-5 w-8" />
        <div className="h-10 w-full rounded-t-xl border-2 border-t border-x border-muted" />
      </div>
    </div>
  );
}

function RankRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5">
      <Skeleton className="h-6 w-8 shrink-0 rounded-full" />
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <Skeleton className="h-4 min-w-0 flex-1 max-w-32" />
      <Skeleton className="h-4 w-8 shrink-0" />
      <div className="hidden w-24 shrink-0 sm:block">
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-sm">
        <PodiumSkeleton />
      </div>
      <div className="space-y-1.5">
        {[4, 5, 6, 7, 8].map((n) => (
          <RankRowSkeleton key={n} />
        ))}
      </div>
    </div>
  );
}
