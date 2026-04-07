import { Badge } from "@repo/ui/components/badge";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { TypographyLabel } from "@repo/ui/components/typography";
import type { TeamComment } from "../team-queries";

export function TeamCommentSummaryCard({
  commentCount,
  comments,
  showScoutNames,
}: {
  commentCount: number;
  comments: TeamComment[];
  showScoutNames: boolean;
}) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="px-3 py-2 border-b bg-muted/30">
        <TypographyLabel>
          {commentCount} Comment{commentCount !== 1 ? "s" : ""}
        </TypographyLabel>
      </div>
      <ScrollArea className="h-72">
        <div className="divide-y">
          {comments.map((c, i) => (
            <div key={i} className="px-4 py-3">
              {showScoutNames && c.scoutName && (
                <Badge variant="outline" className="text-xs font-normal mb-1.5">
                  {c.scoutName}
                </Badge>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.comment}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
