export interface TeamEventOverviewRow {
  teamNumber: number;
  teamName: string | null;
  avgAutoPoints: number;
  avgTeleopPoints: number;
  avgClimbPoints: number;
  avgTotalPoints: number;
  uptimePct: number;
  matchesScouted: number;
  drivetrainType: string | null;
  climbType: string | null;
}
