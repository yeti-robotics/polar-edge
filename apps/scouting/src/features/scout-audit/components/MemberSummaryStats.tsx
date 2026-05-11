import { StatItem, StatItemSkeleton } from "@/components/stat-item";
import type { MemberFormSummary } from "../types";

export function MemberSummaryStats({ summary }: { summary: MemberFormSummary }) {
  return (
    <div className="grid grid-cols-3 gap-6 rounded-xl border bg-muted/20 px-6 py-5">
      <StatItem label="Forms Submitted" value={summary.totalForms} />
      <StatItem label="Avg Cycles / Form" value={summary.avgCyclesPerForm} />
      <StatItem
        label="Flagged"
        value={
          <span className={summary.flaggedCount > 0 ? "text-destructive" : undefined}>
            {summary.flaggedCount}
          </span>
        }
      />
    </div>
  );
}

export function MemberSummaryStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-6 rounded-xl border bg-muted/20 px-6 py-5">
      <StatItemSkeleton />
      <StatItemSkeleton />
      <StatItemSkeleton />
    </div>
  );
}
