import { gameConfig } from "./game-config";
import { clamp, gaussianRandom } from "./team-model";
import type {
  SimulatedClimb,
  SimulatedCycle,
  SimulatedMatch,
  SimulatedMatchResult,
  SimulatedTeamMatch,
  TeamProfile,
} from "./types";

/** Pick from weighted options. Weights don't need to sum to 1. */
function weightedPick<T>(options: T[], weights: readonly number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < options.length; i++) {
    rand -= weights[i]!;
    if (rand <= 0) return options[i]!;
  }
  return options[options.length - 1]!;
}

/** Linear interpolation between two values based on t in [0, 1]. */
function lerp(t: number, [a, b]: readonly [number, number]): number {
  return a + t * (b - a);
}

/** Get skill tier for bucket/climb level weights. */
function skillTier(skill: number): "low" | "mid" | "high" {
  if (skill < 0.3) return "low";
  if (skill < 0.6) return "mid";
  return "high";
}

function simulateCycles(profile: TeamProfile): SimulatedCycle[] {
  const { cycles: cfg } = gameConfig;
  const rawCount = lerp(profile.skill, cfg.countRange) + gaussianRandom() * 0.8;
  const cycleCount = Math.max(1, Math.round(rawCount));

  const tier = skillTier(profile.skill);
  const bucketWeights = cfg.bucketWeights[tier];
  const buckets = [0, 1, 2, 3, 4, 5];

  // Auto gets 1-2 cycles, rest are teleop
  const autoCycles = Math.min(cycleCount, Math.floor(Math.random() * (cfg.autoMaxCycles + 1)));

  const cycles: SimulatedCycle[] = [];
  for (let i = 0; i < cycleCount; i++) {
    const phase = i < autoCycles ? "auto" : "teleop";
    const bucket = weightedPick(buckets, bucketWeights);
    const baseDuration = lerp(profile.skill, cfg.dumpDurationRange);
    const duration = Math.max(1.0, baseDuration + gaussianRandom() * 2.0);

    cycles.push({
      phase,
      cycleNumber: i + 1,
      bucket,
      dumpDuration: Math.round(duration * 100) / 100,
    });
  }

  return cycles;
}

function simulateClimb(profile: TeamProfile): SimulatedClimb | null {
  const cfg = gameConfig.climb;

  const attemptRate = cfg.attemptBaseRate + profile.skill * cfg.attemptSkillBonus;
  if (Math.random() > attemptRate) return null;

  const successRate = cfg.successBaseRate + profile.climbAbility * cfg.successSkillBonus;
  const climbSuccess = Math.random() < successRate;

  const tier = skillTier(profile.climbAbility);
  const levelWeights = cfg.levelWeights[tier];
  const climbLevel = climbSuccess ? weightedPick([0, 1, 2, 3], levelWeights) : 0;

  const baseDuration = lerp(profile.climbAbility, cfg.durationRange);
  const climbDuration = Math.max(1.0, baseDuration + gaussianRandom() * 3.0);

  const phase = Math.random() < cfg.autoClimbRate ? "auto" : "teleop";

  return {
    phase,
    climbLevel,
    climbSuccess,
    climbDuration: Math.round(climbDuration * 100) / 100,
  };
}

function simulateOof(profile: TeamProfile): number {
  const cfg = gameConfig.oof;
  const oofRate = cfg.baseRate - profile.reliability * cfg.reliabilityReduction;

  if (Math.random() > oofRate) return 0;

  // Duration inversely related to reliability
  const duration = lerp(1 - profile.reliability, cfg.durationRange);
  return Math.max(0, Math.round(duration + gaussianRandom() * 10));
}

function pickComment(profile: TeamProfile): string {
  const tier = skillTier(profile.skill);
  const templates = gameConfig.comments[tier];
  return templates[Math.floor(Math.random() * templates.length)]!;
}

function calculatePoints(cycles: SimulatedCycle[], climb: SimulatedClimb | null): number {
  let points = 0;
  for (const c of cycles) {
    points += gameConfig.bucketPointValues[c.bucket] ?? 0;
  }
  if (climb?.climbSuccess) {
    points += gameConfig.climbPointValues[climb.climbLevel] ?? 0;
  }
  return points;
}

/**
 * Simulate one team's performance in a single match.
 * Each call produces independent random outcomes for the same profile,
 * so calling twice for the same team models two scouts observing the same match.
 */
export function simulateTeamMatch(profile: TeamProfile): SimulatedTeamMatch {
  const cycles = simulateCycles(profile);
  const climb = simulateClimb(profile);
  const oofTimeSeconds = simulateOof(profile);
  const comments = pickComment(profile);
  const points = calculatePoints(cycles, climb);

  return {
    teamNumber: profile.teamNumber,
    cycles,
    climb,
    oofTimeSeconds,
    comments,
    points,
  };
}

/**
 * Simulate a full match: generate performance data for all 6 teams
 * and derive alliance scores from the simulated data.
 */
export function simulateMatch(
  match: SimulatedMatch,
  profileMap: Map<number, TeamProfile>
): SimulatedMatchResult {
  const redTeams = match.red.map((slot) => {
    const profile = profileMap.get(slot.teamNumber);
    if (!profile) throw new Error(`No profile for team ${slot.teamNumber}`);
    return simulateTeamMatch(profile);
  });

  const blueTeams = match.blue.map((slot) => {
    const profile = profileMap.get(slot.teamNumber);
    if (!profile) throw new Error(`No profile for team ${slot.teamNumber}`);
    return simulateTeamMatch(profile);
  });

  const redScore = redTeams.reduce((sum, t) => sum + t.points, 0);
  const blueScore = blueTeams.reduce((sum, t) => sum + t.points, 0);

  return {
    matchNumber: match.matchNumber,
    matchType: match.matchType,
    redTeams,
    blueTeams,
    redScore,
    blueScore,
  };
}
