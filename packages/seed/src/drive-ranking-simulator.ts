import { gameConfig } from "./game-config";
import { gaussianRandom } from "./team-model";
import type { Alliance, SimulatedDriveRanking, SimulatedMatch, TeamProfile } from "./types";

/**
 * Simulate drive team rankings for one alliance in one match.
 *
 * Each team's driverSkill is perturbed with gaussian noise,
 * then the 3 teams are ranked by perturbed skill (highest = rank 1).
 */
function rankAlliance(
  teams: { teamNumber: number }[],
  profileMap: Map<number, TeamProfile>,
  alliance: Alliance,
  matchNumber: number
): SimulatedDriveRanking {
  const noise = gameConfig.driveRanking.noise;

  const scored = teams.map((t) => {
    const profile = profileMap.get(t.teamNumber);
    const driverSkill = profile?.driverSkill ?? 0.5;
    return {
      teamNumber: t.teamNumber,
      perturbedSkill: driverSkill + gaussianRandom() * noise,
    };
  });

  // Sort descending by perturbed skill (best first)
  scored.sort((a, b) => b.perturbedSkill - a.perturbedSkill);

  return {
    matchNumber,
    alliance,
    rankedTeams: scored.map((s) => s.teamNumber),
  };
}

/**
 * Simulate drive team rankings for all alliances in a match.
 */
export function simulateDriveRankings(
  match: SimulatedMatch,
  profileMap: Map<number, TeamProfile>
): SimulatedDriveRanking[] {
  return [
    rankAlliance(match.red, profileMap, "red", match.matchNumber),
    rankAlliance(match.blue, profileMap, "blue", match.matchNumber),
  ];
}
