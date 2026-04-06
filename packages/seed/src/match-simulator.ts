import { gameConfig } from "./game-config";
import { gaussianRandom } from "./team-model";
import type {
  SimulatedClimb,
  SimulatedClimbOutcome,
  SimulatedCycle,
  SimulatedMatch,
  SimulatedMatchResult,
  SimulatedTeamMatch,
  TeamProfile,
} from "./types";

export type SimulatedEventCopr = {
  teamNumber: number;
  autoFuelCount: number;
  teleopFuelCount: number;
  endgameFuelCount: number;
  totalFuelCount: number;
};

/** Pick from weighted options. Weights don't need to sum to 1. */
function weightedPick<T>(options: T[], weights: readonly number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < options.length; i++) {
    const w = weights[i] ?? 0;
    const opt = options[i];
    rand -= w;
    if (rand <= 0 && opt !== undefined) return opt;
  }
  return options[options.length - 1] as T;
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

  // Auto gets 1-2 cycles, rest are teleop
  const autoCycles = Math.min(cycleCount, Math.floor(Math.random() * (cfg.autoMaxCycles + 1)));

  const cycles: SimulatedCycle[] = [];
  for (let i = 0; i < cycleCount; i++) {
    const phase = i < autoCycles ? "auto" : "teleop";
    const baseDuration = lerp(profile.skill, cfg.dumpDurationRange);
    const duration = Math.max(1.0, baseDuration + gaussianRandom() * 2.0);

    cycles.push({
      phase,
      cycleNumber: i + 1,
      dumpDuration: Math.round(duration * 100) / 100,
    });
  }

  return cycles;
}

/**
 * Simulate a climb attempt (timing only) and the TBA outcome (level).
 * Returns both the scout-observed timing and the authoritative TBA outcome.
 */
function simulateClimb(
  profile: TeamProfile
): { climb: SimulatedClimb; outcome: SimulatedClimbOutcome } | null {
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
    climb: {
      phase,
      climbDuration: Math.round(climbDuration * 100) / 100,
    },
    outcome: {
      autoClimbLevel: phase === "auto" ? climbLevel : 0,
      endgameClimbLevel: phase === "teleop" ? climbLevel : 0,
    },
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
  return templates[Math.floor(Math.random() * templates.length)] ?? "";
}

function calculatePoints(
  cycles: SimulatedCycle[],
  climbOutcome: SimulatedClimbOutcome,
  profile: TeamProfile
): number {
  // Fuel points derived from skill-based BPS × duration (mimics COPR estimation)
  const bps = lerp(profile.skill, gameConfig.cycles.fuelRateRange);
  let points = 0;
  for (const c of cycles) {
    points += bps * c.dumpDuration;
  }
  points += gameConfig.climbPointValues[climbOutcome.autoClimbLevel] ?? 0;
  points += gameConfig.climbPointValues[climbOutcome.endgameClimbLevel] ?? 0;
  return Math.round(points);
}

/**
 * Simulate one team's performance in a single match.
 * Each call produces independent random outcomes for the same profile,
 * so calling twice for the same team models two scouts observing the same match.
 */
export function simulateTeamMatch(profile: TeamProfile): SimulatedTeamMatch {
  const cycles = simulateCycles(profile);
  const climbResult = simulateClimb(profile);
  const oofTimeSeconds = simulateOof(profile);
  const comments = pickComment(profile);
  const climbOutcome: SimulatedClimbOutcome = climbResult?.outcome ?? {
    autoClimbLevel: 0,
    endgameClimbLevel: 0,
  };
  const points = calculatePoints(cycles, climbOutcome, profile);

  return {
    teamNumber: profile.teamNumber,
    cycles,
    climb: climbResult?.climb ?? null,
    climbOutcome,
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

/**
 * Generate COPR-like fuel counts for each team from simulated match results.
 * Averages per-match fuel across all matches the team played at the event,
 * mimicking TBA's OPR regression output.
 */
export function generateEventCoprs(
  results: SimulatedMatchResult[],
  profileMap: Map<number, TeamProfile>
): SimulatedEventCopr[] {
  const teamFuel = new Map<
    number,
    { autoTotal: number; teleopTotal: number; matchCount: number }
  >();

  for (const result of results) {
    for (const teamMatch of [...result.redTeams, ...result.blueTeams]) {
      const entry = teamFuel.get(teamMatch.teamNumber) ?? {
        autoTotal: 0,
        teleopTotal: 0,
        matchCount: 0,
      };

      const profile = profileMap.get(teamMatch.teamNumber);
      const bps = profile ? lerp(profile.skill, gameConfig.cycles.fuelRateRange) : 0;

      for (const c of teamMatch.cycles) {
        const fuel = bps * c.dumpDuration;
        if (c.phase === "auto") entry.autoTotal += fuel;
        else entry.teleopTotal += fuel;
      }
      entry.matchCount += 1;
      teamFuel.set(teamMatch.teamNumber, entry);
    }
  }

  const coprs: SimulatedEventCopr[] = [];
  for (const [teamNumber, fuel] of teamFuel) {
    const n = fuel.matchCount || 1;
    const auto = fuel.autoTotal / n;
    const teleop = fuel.teleopTotal / n;
    // Endgame fuel is a small portion of teleop (simulates late-game scoring)
    const endgame = teleop * 0.15;
    const adjustedTeleop = teleop - endgame;
    coprs.push({
      teamNumber,
      autoFuelCount: Math.round(auto * 100) / 100,
      teleopFuelCount: Math.round(adjustedTeleop * 100) / 100,
      endgameFuelCount: Math.round(endgame * 100) / 100,
      totalFuelCount: Math.round((auto + teleop) * 100) / 100,
    });
  }

  return coprs;
}
