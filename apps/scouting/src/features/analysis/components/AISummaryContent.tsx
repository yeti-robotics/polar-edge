import { Skeleton } from "@repo/ui/components/skeleton";
import { TypographyLabel, TypographyMuted } from "@repo/ui/components/typography";
import { cn } from "@repo/ui/lib/utils";
import type { CommentSummary } from "../team-queries";

const sentimentStyle = {
  Positive: {
    border: "border-l-green-500",
    text: "text-green-600 dark:text-green-400",
  },
  Neutral: {
    border: "border-l-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  Negative: {
    border: "border-l-red-500",
    text: "text-red-600 dark:text-red-400",
  },
} as const;

export function AISummaryContent({ summary }: { summary: CommentSummary }) {
  return (
    <div className="space-y-3 motion-safe:animate-[reveal_0.4s_ease-out]">
      <TypographyMuted className="max-w-prose motion-safe:animate-[reveal_0.5s_ease-out_both]">
        {summary.summary}
      </TypographyMuted>

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["Reliability", summary.reliability],
            ["Defense", summary.defense],
            ["Overall", summary.overall],
          ] as const
        ).map(([label, sentiment], i) => (
          <div
            key={label}
            className={cn(
              "rounded-md border border-l-3 bg-muted/30 px-3 py-2 motion-safe:animate-[reveal_0.4s_ease-out_both]",
              sentimentStyle[sentiment].border
            )}
            style={{ animationDelay: `${(i + 1) * 100}ms` }}
          >
            <TypographyLabel className="mb-0.5">{label}</TypographyLabel>
            <p className={cn("text-sm font-semibold", sentimentStyle[sentiment].text)}>
              {sentiment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AISummarySkeleton() {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full max-w-prose" />
        <Skeleton className="h-4 w-3/4 max-w-prose" />
        <Skeleton className="h-4 w-1/2 max-w-prose" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-14 w-full rounded-md" />
        <Skeleton className="h-14 w-full rounded-md" />
        <Skeleton className="h-14 w-full rounded-md" />
      </div>
    </div>
  );
}
