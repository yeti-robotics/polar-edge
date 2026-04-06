import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
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
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={`text-2xl font-bold tabular-nums tracking-tight leading-none${valueClass ? ` ${valueClass}` : ""}`}
      >
        {value}
        {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground/70 leading-tight">{description}</p>
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
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {acronym}
        </p>
        <p className="text-xs text-muted-foreground/70 leading-tight mt-0.5">{fullName}</p>
      </div>
      <p
        className={`text-3xl font-bold tabular-nums tracking-tight leading-none${valueClass ? ` ${valueClass}` : ""}`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground/70 leading-tight">{description}</p>
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
    <Tabs defaultValue="overview">
      <Card className="relative pt-0 gap-y-1">
        <CardHeader className="py-0 flex items-center justify-end sm:justify-between px-0">
          <CardTitle className="py-3 hidden sm:block text-xs font-mono uppercase tracking-widest text-muted-foreground font-medium pl-6">
            Performance Summary
          </CardTitle>
          <TabsList className="mb-4 rounded-tl-none rounded-br-none self-end sm:self-center">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="overview" className="space-y-5">
            {/* Fuel scoring */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
              <MetricTile label="Avg Auto" value={metrics.avgAutoPoints} unit="fuel" />
              <MetricTile label="Avg Teleop" value={metrics.avgTeleopPoints} unit="fuel" />
              <MetricTile label="Avg BPS" value={metrics.avgBallsPerSecond} unit="balls/s" />
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
          </TabsContent>

          <TabsContent value="advanced">
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
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}
