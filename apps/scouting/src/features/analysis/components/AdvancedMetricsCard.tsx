import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { TypographyLabel } from "@repo/ui/components/typography";
import type { TeamKeyMetrics } from "../team-queries";
import { AdvancedMetricTile } from "./metric-tiles";

export function AdvancedMetricsCard({ metrics }: { metrics: TeamKeyMetrics }) {
  const goblinClass =
    metrics.avgGoblin > 1
      ? "text-green-600 dark:text-green-400"
      : metrics.avgGoblin < -1
        ? "text-red-600 dark:text-red-400"
        : undefined;

  const goblinDisplay = metrics.avgGoblin > 0 ? `+${metrics.avgGoblin}` : String(metrics.avgGoblin);

  return (
    <Card>
      <CardHeader>
        <TypographyLabel className="font-medium">Advanced Metrics</TypographyLabel>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AdvancedMetricTile
            acronym="CLANK"
            fullName="Climb Level Accuracy & No-Knockdown"
            value={metrics.avgClank}
            description={`Climb pts adjusted for speed: +2 for \u22643s, -2 for >6s. Pure avg is ${metrics.avgClimbPoints} pts.`}
          />
          <AdvancedMetricTile
            acronym="RPMagic"
            fullName="Ranking Points \u2014 Match Advantage Generated In Cycles"
            value={metrics.avgRpMagic.toFixed(3)}
            description="Marginal probability of earning an RP attributable to this team's scoring contribution per match."
          />
          <AdvancedMetricTile
            acronym="GOBLIN"
            fullName="Game Outcome Boost from Luck, In Numbers"
            value={goblinDisplay}
            description="Difference between actual match margin and expected margin based on scouted performance. Positive = luckier than expected."
            valueClass={goblinClass}
          />
        </div>
      </CardContent>
    </Card>
  );
}
