import "server-only";

import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/database";
import { pitForm } from "@/lib/database/schema";

type Props = {
  teamNumbers: number[];
  teamNames: (string | null)[];
};

function PitCard({
  teamNumber,
  teamName,
  data,
}: {
  teamNumber: number;
  teamName: string | null;
  data: typeof pitForm.$inferSelect | undefined;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Team {teamNumber}
          </p>
          {teamName && <p className="text-sm text-foreground font-normal mt-0.5">{teamName}</p>}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {!data ? (
          <p className="text-sm text-muted-foreground/60 py-4 text-center">No pit data scouted</p>
        ) : (
          <div className="space-y-3">
            <Row label="Drivetrain" value={formatDrivetrain(data.drivetrainType)} />
            <Row label="Weight" value={data.weight ? `${data.weight} lbs` : "—"} />
            <Row label="Capacity" value={data.capacity ? `${data.capacity}` : "—"} />
            {data.climbType && <Row label="Climb Type" value={formatClimbType(data.climbType)} />}
            {data.shooterType && (
              <Row label="Shooter" value={formatShooterType(data.shooterType)} />
            )}
            {data.shooterType && (
              <Row label="Move Shot" value={data.canShootWhileMoving ? "Yes" : "No"} />
            )}
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground w-24 shrink-0 pt-0.5">
                Capabilities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.canTrench && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    Trench
                  </Badge>
                )}
                {data.canBump && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    Bump
                  </Badge>
                )}
                {data.canShuttle && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    Shuttle
                  </Badge>
                )}
                {!data.canTrench && !data.canBump && !data.canShuttle && (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground w-24 shrink-0">
        {label}
      </span>
      <span className="text-sm text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function formatDrivetrain(type: string): string {
  const map: Record<string, string> = {
    tank: "Tank Drive",
    swerve: "Swerve Drive",
    mecanum: "Mecanum Drive",
    west_coast: "West Coast",
    other: "Other",
  };
  return map[type] ?? type;
}

function formatClimbType(type: string): string {
  const map: Record<string, string> = {
    none: "None",
    passive: "Passive",
    active: "Active",
    buddy: "Buddy Climb",
  };
  return map[type] ?? type;
}

function formatShooterType(type: string): string {
  const map: Record<string, string> = {
    turret: "Turret Shooter",
    fixed: "Fixed Shooter",
  };
  return map[type] ?? type;
}

export async function ComparisonPitData({ teamNumbers, teamNames }: Props) {
  const pitRows = await db.select().from(pitForm).where(inArray(pitForm.teamNumber, teamNumbers));

  const pitByTeam = new Map(pitRows.map((r) => [r.teamNumber, r]));

  // Only show if at least one team has pit data
  const hasAnyData = teamNumbers.some((n) => pitByTeam.has(n));
  if (!hasAnyData) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Pit Scouting
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamNumbers.map((num, i) => (
          <PitCard
            key={num}
            teamNumber={num}
            teamName={teamNames[i] ?? null}
            data={pitByTeam.get(num)}
          />
        ))}
      </div>
    </div>
  );
}
