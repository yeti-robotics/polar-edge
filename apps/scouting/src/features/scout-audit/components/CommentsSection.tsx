import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";

export function CommentsSection({ comments }: { comments: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        {comments.trim().length === 0 ? (
          <TypographyMuted>No comments recorded.</TypographyMuted>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{comments}</p>
        )}
      </CardContent>
    </Card>
  );
}
