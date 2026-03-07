import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import type { ValidationSummary } from "../queries";

function coverageColor(pct: number) {
  if (pct >= 90) return "text-primary";
  if (pct >= 70) return "text-warning";
  return "text-destructive";
}

function goblinColor(val: number) {
  if (val > 20) return "text-destructive";
  return undefined;
}

export function ValidationSummaryCards({ summary }: { summary: ValidationSummary }) {
  const { playedMatchCount, avgAbsGoblin, totalSlots, scoutedSlots, singleScoutSlots } = summary;
  const coveragePct = totalSlots > 0 ? Math.round((scoutedSlots / totalSlots) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Matches Scored
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-3xl font-bold">{playedMatchCount}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Avg |Goblin|</CardTitle>
        </CardHeader>
        <CardContent>
          <span className={`text-3xl font-bold ${goblinColor(avgAbsGoblin) ?? ""}`}>
            {avgAbsGoblin.toFixed(1)}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <span className={`text-3xl font-bold ${coverageColor(coveragePct)}`}>
            {scoutedSlots}/{totalSlots}
          </span>
          <span className="ml-2 text-sm text-muted-foreground">({coveragePct}%)</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Single-Scout Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className={`text-3xl font-bold ${singleScoutSlots > 0 ? "text-warning" : ""}`}>
            {singleScoutSlots}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
