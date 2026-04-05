import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { TypographyLabel, TypographySmall } from "@repo/ui/components/typography";
import { cn } from "@repo/ui/lib/utils";
import type { TeamKeyMetrics } from "../team-queries";

function MetricTile({
  label,
  value,
  unit,
  description,
  valueClass,
}: {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <TypographyLabel>{label}</TypographyLabel>
      <p className={cn("text-2xl font-bold tabular-nums tracking-tight leading-none", valueClass)}>
        {value}
        {unit && (
          <TypographySmall className="font-normal text-muted-foreground ml-1">
            {unit}
          </TypographySmall>
        )}
      </p>
      {description && (
        <TypographySmall className="text-muted-foreground/70 leading-tight">
          {description}
        </TypographySmall>
      )}
    </div>
  );
}

function AdvancedMetricTile({
  acronym,
  fullName,
  value,
  description,
  valueClass,
}: {
  acronym: string;
  fullName: string;
  value: string | number;
  description: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border p-4">
      <div>
        <TypographyLabel>{acronym}</TypographyLabel>
        <TypographySmall className="text-muted-foreground/70 leading-tight mt-0.5">
          {fullName}
        </TypographySmall>
      </div>
      <p className={cn("text-3xl font-bold tabular-nums tracking-tight leading-none", valueClass)}>
        {value}
      </p>
      <TypographySmall className="text-muted-foreground/70 leading-tight">
        {description}
      </TypographySmall>
    </div>
  );
}

export function TeamKeyMetricsCard({ metrics }: { metrics: TeamKeyMetrics }) {
  const uptimeClass =
    metrics.avgUptimePct >= 90
      ? "text-green-600 dark:text-green-400"
      : metrics.avgUptimePct >= 75
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const downtimeClass =
    metrics.avgDowntimeSeconds <= 5
      ? "text-green-600 dark:text-green-400"
      : metrics.avgDowntimeSeconds <= 20
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const brokeRatio = metrics.brokeCount / metrics.totalMatchesScouted;
  const brokeClass =
    brokeRatio === 0
      ? "text-green-600 dark:text-green-400"
      : brokeRatio < 0.3
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

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
        <TypographyLabel className="font-medium">Performance Summary</TypographyLabel>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Fuel scoring */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <MetricTile label="Avg Auto" value={metrics.avgAutoPoints} unit="fuel" />
          <MetricTile label="Avg Teleop" value={metrics.avgTeleopPoints} unit="fuel" />
          <MetricTile label="Matches Scouted" value={metrics.totalMatchesScouted} />
        </div>

        <div className="border-t" />

        {/* Climb scoring */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <MetricTile label="Avg Climb" value={metrics.avgClimbPoints} unit="pts" />
          <MetricTile label="Auto Climb" value={metrics.avgAutoClimbPoints} unit="pts" />
          <MetricTile label="Teleop Climb" value={metrics.avgTeleopClimbPoints} unit="pts" />
        </div>

        <div className="border-t" />

        {/* Reliability */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <MetricTile
            label="Avg Uptime"
            value={`${metrics.avgUptimePct}%`}
            valueClass={uptimeClass}
          />
          <MetricTile
            label="Avg Downtime"
            value={metrics.avgDowntimeSeconds}
            unit="s / match"
            valueClass={downtimeClass}
          />
          <MetricTile
            label="Broke"
            value={`${metrics.brokeCount} / ${metrics.totalMatchesScouted}`}
            unit="matches"
            valueClass={brokeClass}
          />
        </div>

        <div className="border-t" />

        {/* Advanced metrics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AdvancedMetricTile
            acronym="CLANK"
            fullName="Climb Level Accuracy & No-Knockdown"
            value={metrics.avgClank}
            description={`Climb pts adjusted for speed: +2 for ≤3s, -2 for >6s. Pure avg is ${metrics.avgClimbPoints} pts.`}
          />
          <AdvancedMetricTile
            acronym="RPMagic"
            fullName="Ranking Points — Match Advantage Generated In Cycles"
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
