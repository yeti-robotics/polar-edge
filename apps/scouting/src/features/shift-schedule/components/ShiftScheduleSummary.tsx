import { Card, CardContent } from "@repo/ui/components/card";

type Props = {
  assignmentCount: number;
  scheduledScoutCount: number;
  myAssignmentCount: number;
  items?: Array<{ label: string; value: number }>;
  variant?: "default" | "compact";
};

export function ShiftScheduleSummary({
  assignmentCount,
  scheduledScoutCount,
  myAssignmentCount,
  items,
  variant = "default",
}: Props) {
  const stats = items ?? [
    { label: "Assignments", value: assignmentCount },
    { label: "Scheduled Scouts", value: scheduledScoutCount },
    { label: "Your Assignments", value: myAssignmentCount },
  ];

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-md border border-border bg-muted/20 px-2.5 py-1"
          >
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {stat.label}
            </p>
            <p className="text-sm font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/70 bg-background shadow-none">
          <CardContent className="flex items-center justify-between px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {stat.label}
            </p>
            <p className="text-base font-semibold tabular-nums">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
