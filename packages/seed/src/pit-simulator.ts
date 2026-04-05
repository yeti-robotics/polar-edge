import { gameConfig } from "./game-config";
import type { SimulatedPitForm, TeamProfile } from "./types";

/** Pick from weighted options by string key. */
function weightedPickFromRecord(weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let rand = Math.random() * total;
  for (const [key, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return key;
  }
  return (entries[entries.length - 1] ?? [""])[0];
}

/** Probability that scales linearly with skill between [low, high]. */
function skillProbability(skill: number, [low, high]: readonly [number, number]): boolean {
  const rate = low + skill * (high - low);
  return Math.random() < rate;
}

function lerp(t: number, [a, b]: readonly [number, number]): number {
  return a + t * (b - a);
}

export function simulatePitForm(profile: TeamProfile): SimulatedPitForm {
  const cfg = gameConfig.pit;

  const drivetrainType = weightedPickFromRecord(cfg.drivetrainWeights) as
    | "tank"
    | "swerve"
    | "mecanum"
    | "other";

  const shooterResult = weightedPickFromRecord(cfg.shooterWeights);
  const shooterType = shooterResult === "none" ? null : (shooterResult as "turret" | "fixed");

  const hasClimb = skillProbability(profile.skill, cfg.hasClimbRate);
  const climbType = hasClimb
    ? (cfg.climbTypeOptions[Math.floor(Math.random() * cfg.climbTypeOptions.length)] ?? null)
    : null;

  const capacity = Math.round(lerp(profile.skill, cfg.capacityRange));
  // Weight is inversely correlated: better teams are slightly lighter/more optimized
  const weight = Math.round(lerp(1 - profile.skill * 0.3, cfg.weightRange));

  return {
    teamNumber: profile.teamNumber,
    drivetrainType,
    canTrench: skillProbability(profile.skill, cfg.capabilities.canTrench),
    canBump: skillProbability(profile.skill, cfg.capabilities.canBump),
    canShuttle: skillProbability(profile.skill, cfg.capabilities.canShuttle),
    capacity,
    weight,
    climbType,
    shooterType,
    canShootWhileMoving: shooterType
      ? skillProbability(profile.skill, cfg.capabilities.canShootWhileMoving)
      : false,
  };
}
