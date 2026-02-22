import { Skeleton } from "@repo/ui/components/skeleton";
import type { ReactNode } from "react";

export function StatItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground font-mono mb-2.5">
        {label}
      </p>
      <p className="text-4xl tabular-nums leading-none tracking-normal mb-3">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

export function StatItemSkeleton() {
  return (
    <div>
      <Skeleton className="h-2.5 w-16 mb-2.5" />
      <Skeleton className="h-11 w-20 mb-3" />
    </div>
  );
}
