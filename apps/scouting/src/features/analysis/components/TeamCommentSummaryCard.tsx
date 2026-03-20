"use client";

import { Badge } from "@repo/ui/components/badge";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { TypographyLabel, TypographyMuted, TypographySmall } from "@repo/ui/components/typography";
import { cn } from "@repo/ui/lib/utils";
import { MessageSquareText } from "lucide-react";
import { useState } from "react";
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedComment = comments[selectedIndex];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-lg border overflow-hidden">
      {/* Left pane — comment list */}
      <div className="md:border-r">
        <div className="px-3 py-2 border-b bg-muted/30">
          <TypographyLabel>
            {commentCount} Comment{commentCount !== 1 ? "s" : ""}
          </TypographyLabel>
        </div>
        <ScrollArea className="h-64">
          <div className="divide-y">
            {comments.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "w-full text-left px-3 py-2.5 transition-colors",
                  i === selectedIndex ? "bg-accent" : "hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {showScoutNames && c.scoutName && (
                    <Badge variant="outline" className="shrink-0 text-xs font-normal">
                      {c.scoutName}
                    </Badge>
                  )}
                  <TypographySmall className="text-muted-foreground truncate">
                    {c.comment}
                  </TypographySmall>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right pane — selected comment */}
      <div className="flex flex-col">
        <div className="px-3 py-2 border-b bg-muted/30 flex items-center gap-1.5">
          <MessageSquareText className="size-3.5 text-muted-foreground" />
          <TypographyLabel>Detail</TypographyLabel>
        </div>
        <ScrollArea className="h-64">
          <div className="p-4">
            {selectedComment ? (
              <div className="space-y-3">
                {showScoutNames && selectedComment.scoutName && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {selectedComment.scoutName}
                  </Badge>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedComment.comment}
                </p>
              </div>
            ) : (
              <TypographyMuted>Select a comment to view</TypographyMuted>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
