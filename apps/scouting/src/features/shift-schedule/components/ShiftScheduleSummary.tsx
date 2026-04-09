import { Card, CardContent } from "@repo/ui/components/card";

type Props = {
  scheduledScoutCount: number;
  variant?: "default" | "compact";
};

export function ShiftScheduleSummary({
  scheduledScoutCount,
  variant = "default",
}: Props) {
  if (variant === "compact") {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <div className="rounded-md border border-border bg-muted/20 px-2.5 py-1">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Scheduled Scouts
          </p>
          <p className="text-sm font-semibold tabular-nums">{scheduledScoutCount}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-1">
      <Card className="border-border/70 bg-background shadow-none">
        <CardContent className="flex items-center justify-between px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Scheduled Scouts
          </p>
          <p className="text-base font-semibold tabular-nums">{scheduledScoutCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
