import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import { CompatibilityNotesDialog } from "@/features/picklist/components/CompatibilityNotesDialog";
import type { TeamWorkabilitySummary } from "../types";
import { formatWorkabilityScore, getCoverageLabel } from "../utils";

function WorkabilityMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums tracking-tight leading-none">{value}</p>
    </div>
  );
}

export function TeamWorkabilityCard({ summary }: { summary: TeamWorkabilitySummary | null }) {
  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workability</CardTitle>
        </CardHeader>
        <CardContent>
          <TypographyMuted>No workability data available for this team.</TypographyMuted>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
          <WorkabilityMetric
            label="Driver"
            value={formatWorkabilityScore(summary.avgDriverWorkability)}
          />
          <WorkabilityMetric
            label="Human Player"
            value={formatWorkabilityScore(summary.avgHumanPlayerWorkability)}
          />
          <WorkabilityMetric
            label="Composite"
            value={formatWorkabilityScore(summary.compositeCompatibilityScore)}
          />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Submissions
            </p>
            <p className="text-2xl font-bold tabular-nums tracking-tight leading-none">
              {summary.submissionCount}
            </p>
            <p className="text-xs text-muted-foreground">{getCoverageLabel(summary)}</p>
          </div>
        </div>

        {summary.noteCount > 0 && (
          <div className="mt-4 border-t pt-4">
            <CompatibilityNotesDialog notes={summary.notes} noteCount={summary.noteCount} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
