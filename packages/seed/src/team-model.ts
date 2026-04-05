import { gameConfig } from "./game-config";
import type { TeamProfile } from "./types";

/** Box-Muller transform: generate a standard normal random variable. */
function gaussianRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Generate a skill value from an exponential distribution.
 *
 * Uses inverse CDF: skill = 1 - exp(-λ * U) where U ~ Uniform(0, 1).
 * This produces values in [0, 1) with most teams clustered near 0
 * and a thin right tail — matching real FRC EPA distributions.
 */
function exponentialSkill(lambda: number): number {
  const u = Math.random();
  return clamp(1 - Math.exp(-lambda * u), 0, 1);
}

/**
 * Generate a trait that correlates with base skill but has independent noise.
 */
function correlatedTrait(baseSkill: number, noiseStdDev: number): number {
  return clamp(baseSkill + gaussianRandom() * noiseStdDev, 0, 1);
}

/**
 * Generate team profiles with exponentially distributed skill levels.
 */
export function generateTeamProfiles(teamNumbers: number[]): TeamProfile[] {
  const { lambda, traitNoiseStdDev } = gameConfig.skillDistribution;

  return teamNumbers.map((teamNumber) => {
    const skill = exponentialSkill(lambda);
    return {
      teamNumber,
      skill,
      driverSkill: correlatedTrait(skill, traitNoiseStdDev),
      reliability: correlatedTrait(skill, traitNoiseStdDev),
      climbAbility: correlatedTrait(skill, traitNoiseStdDev),
    };
  });
}

/** Utility exports for use by simulators. */
export { clamp, gaussianRandom };
