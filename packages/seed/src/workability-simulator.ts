import { gameConfig } from "./game-config";
import { clamp, gaussianRandom } from "./team-model";
import type { SimulatedWorkabilityForm, TeamProfile } from "./types";

const WORKABILITY_NOTES: Record<"low" | "mid" | "high", string[]> = {
  low: [
    "Driver communication was difficult. Hard to coordinate cycle timing with this team.",
    "Lots of collision — felt like they weren't aware of alliance partners on the field.",
    "Very little communication from the drive team. Unpredictable movements made spacing tough.",
    "Struggled to maintain consistent field positioning. Bumped into us several times.",
    "Driver seemed reactive rather than proactive. Hard to run parallel cycles with them.",
    "Human player timing was off. Missed several loading windows that cost us cycles.",
  ],
  mid: [
    "Decent communication. A bit slow to respond to spacing calls but generally cooperative.",
    "Average coordination. They stayed mostly out of the way but didn't actively help align.",
    "Okay to work with. Nothing notable — did their job without much back-and-forth.",
    "Workable alliance partner. Could improve on field awareness but no major issues.",
    "Human player was consistent but timing wasn't always synced with our cycles.",
    "Solid enough. Would work with them again — just not our top pick for coordinated play.",
  ],
  high: [
    "Excellent communication. Drive team was calling out positions and kept cycles smooth.",
    "Very easy to work with. Great spacing awareness and proactive field coordination.",
    "Outstanding alliance partner. They anticipated our movements and matched our pace perfectly.",
    "Top-tier communication from the driver station. Every cycle window was cleanly handed off.",
    "Human player had great timing — loading was fast and always synced with our approach.",
    "Highly coachable and aware. Would love to have them as an alliance partner in elims.",
  ],
};

/**
 * Simulate one workability submission for a team in a match.
 *
 * Rating is derived from the team's driverSkill profile (higher skill → easier to work with),
 * perturbed by gaussian noise and clamped to the 1–5 scale.
 */
export function simulateWorkabilityForm(
  teamNumber: number,
  profile: TeamProfile,
  role: "driver" | "human_player"
): SimulatedWorkabilityForm {
  const { ratingNoise, noteRate } = gameConfig.workability;

  // Map driverSkill (0–1) to a base rating in the 1–5 range
  const baseRating = 1 + profile.driverSkill * 4;
  const noisy = baseRating + gaussianRandom() * ratingNoise;
  const rating = clamp(Math.round(noisy), 1, 5);

  let notes = "";
  if (Math.random() < noteRate) {
    const tier = rating <= 2 ? "low" : rating >= 4 ? "high" : "mid";
    const pool = WORKABILITY_NOTES[tier];
    notes = pool[Math.floor(Math.random() * pool.length)] ?? "";
  }

  return { teamNumber, role, rating, notes };
}
