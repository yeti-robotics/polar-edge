import { Skeleton } from "@repo/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        <Skeleton className="h-8 w-40" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-1.5 h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-14 shrink-0" />
            </div>
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
