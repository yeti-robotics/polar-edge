import { Skeleton } from "@repo/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
      <div className="rounded-lg border p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-md border p-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-2 h-7 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <Skeleton className="mb-4 h-10 w-full" />
        <Skeleton className="h-90 w-full" />
      </div>
    </div>
  );
}
