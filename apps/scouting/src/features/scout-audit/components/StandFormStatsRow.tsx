import { StatItem, StatItemSkeleton } from "@/components/stat-item";
import { COMMENTS_MIN_LENGTH, OOF_BROKEN_THRESHOLD } from "../utils";

type Props = {
  oofTimeSeconds: number;
  autoCycles: number;
  teleopCycles: number;
  climbCount: number;
  commentsLength: number;
  canShuttle: boolean | null;
};

function flagValue(value: React.ReactNode, flagged: boolean): React.ReactNode {
  return flagged ? <span className="text-destructive">{value}</span> : value;
}

export function StandFormStatsRow({
  oofTimeSeconds,
  autoCycles,
  teleopCycles,
  climbCount,
  commentsLength,
  canShuttle,
}: Props) {
  const totalCycles = autoCycles + teleopCycles;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 rounded-xl border bg-muted/20 px-6 py-5">
      <StatItem
        label="OOF (s)"
        value={flagValue(oofTimeSeconds, oofTimeSeconds >= OOF_BROKEN_THRESHOLD)}
      />
      <StatItem
        label="Auto Cycles"
        value={flagValue(autoCycles, totalCycles === 0 && oofTimeSeconds === 0)}
      />
      <StatItem
        label="Teleop Cycles"
        value={flagValue(teleopCycles, totalCycles === 0 && oofTimeSeconds === 0)}
      />
      <StatItem label="Climbs" value={climbCount} />
      <StatItem
        label="Comment Len"
        value={flagValue(commentsLength, commentsLength < COMMENTS_MIN_LENGTH)}
      />
      <StatItem label="Can Shuttle" value={canShuttle === null ? "—" : canShuttle ? "Yes" : "No"} />
    </div>
  );
}

export function StandFormStatsRowSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 rounded-xl border bg-muted/20 px-6 py-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <StatItemSkeleton key={i} />
      ))}
    </div>
  );
}
