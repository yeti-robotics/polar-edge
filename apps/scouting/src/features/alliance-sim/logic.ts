import { predictWin, rating } from "openskill";
import type { AllianceSlot, SimResult, SimTeam } from "./types";

/**
 * Compute win probabilities for two alliances using OpenSkill's predictWin.
 *
 * Each alliance is treated as a "team" of 3 players. predictWin returns the
 * probability each team wins a head-to-head matchup based on Bayesian skill
 * estimates (mu/sigma).
 */
export function simulateAlliances(
  alliance1: [SimTeam, SimTeam, SimTeam],
  alliance2: [SimTeam, SimTeam, SimTeam]
): SimResult {
  const team1 = alliance1.map((t) => rating({ mu: t.mu, sigma: t.sigma }));
  const team2 = alliance2.map((t) => rating({ mu: t.mu, sigma: t.sigma }));

  const [pct1, pct2] = predictWin([team1, team2]) as [number, number];

  const alliance1AvgPoints = alliance1.reduce((sum, t) => sum + t.avgTotalPoints, 0);
  const alliance2AvgPoints = alliance2.reduce((sum, t) => sum + t.avgTotalPoints, 0);

  return {
    alliance1WinPct: pct1,
    alliance2WinPct: pct2,
    alliance1AvgPoints: Math.round(alliance1AvgPoints * 10) / 10,
    alliance2AvgPoints: Math.round(alliance2AvgPoints * 10) / 10,
  };
}

/**
 * Check if an alliance is fully populated (3 non-null teams).
 */
export function isAllianceComplete(
  alliance: AllianceSlot[]
): alliance is [SimTeam, SimTeam, SimTeam] {
  return alliance.length === 3 && alliance.every((t) => t !== null);
}
