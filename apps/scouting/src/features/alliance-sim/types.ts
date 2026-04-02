export type SimTeam = {
  teamNumber: number;
  teamName: string;
  mu: number;
  sigma: number;
  ordinal: number;
  avgTotalPoints: number;
  climbSuccessPct: number;
  uptimePct: number;
  matchesScouted: number;
};

export type AllianceSlot = SimTeam | null;

export type SimResult = {
  /** Win probability for alliance 1 (0-1) */
  alliance1WinPct: number;
  /** Win probability for alliance 2 (0-1) */
  alliance2WinPct: number;
  /** Combined average points for alliance 1 */
  alliance1AvgPoints: number;
  /** Combined average points for alliance 2 */
  alliance2AvgPoints: number;
};
