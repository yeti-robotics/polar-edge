import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyLabel, TypographyMuted } from "@repo/ui/components/typography";
import { cn } from "@repo/ui/lib/utils";
import type { CommentSummary } from "../team-queries";

const sentimentStyle = {
  Positive: "text-green-600 dark:text-green-400",
  Neutral: "text-amber-600 dark:text-amber-400",
  Negative: "text-red-600 dark:text-red-400",
} as const;

export function AISummaryContent({ summary }: { summary: CommentSummary }) {
  return (
    <div className="space-y-4 motion-safe:animate-[reveal_0.4s_ease-out]">
      {/* Sentiments first — scannable at a glance */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(
          [
            ["Overall", summary.overall],
            ["Reliability", summary.reliability],
            ["Defense", summary.defense],
          ] as const
        ).map(([label, sentiment], i) => (
          <div
            key={label}
            className="flex flex-col gap-1 motion-safe:animate-[reveal_0.4s_ease-out_both]"
            style={{ animationDelay: `${(i + 1) * 100}ms` }}
          >
            <TypographyLabel>{label}</TypographyLabel>
            <p className={cn("text-lg font-semibold", sentimentStyle[sentiment])}>{sentiment}</p>
          </div>
        ))}
      </div>

      <div className="border-t" />

      {/* Detailed summary below */}
      <TypographyMuted className="max-w-prose leading-relaxed motion-safe:animate-[reveal_0.5s_ease-out_both]">
        {summary.summary}
      </TypographyMuted>
    </div>
  );
}

export function AISummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
      <div className="border-t" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full max-w-prose" />
        <Skeleton className="h-4 w-3/4 max-w-prose" />
        <Skeleton className="h-4 w-1/2 max-w-prose" />
      </div>
    </div>
  );
}
