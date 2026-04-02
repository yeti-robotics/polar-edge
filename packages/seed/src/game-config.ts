/**
 * Year-specific game configuration.
 *
 * This is the ONLY file that needs to change between FRC seasons.
 * All simulation parameters are defined here — the engine code
 * reads from this config and never hardcodes game-specific values.
 */
export const gameConfig = {
  // ── Skill distribution ─────────────────────────────────────────
  // Exponential distribution matching real FRC EPA data:
  // bulk of teams low-to-mid, thin right tail of elite teams.
  skillDistribution: {
    /** Rate parameter. Higher = more teams clustered at low skill. */
    lambda: 3.0,
    /** Std dev for trait noise (driverSkill, reliability, climbAbility). */
    traitNoiseStdDev: 0.15,
  },

  // ── District structure ──────────────────────────────────────────
  // Models a realistic FRC district season.
  // Each team attends exactly 2 district events, then top performers
  // advance to the district championship.
  teamCount: 150,
  district: {
    /** Teams per district event. Randomly chosen in this range per event. */
    teamsPerEvent: [26, 32] as [number, number],
    /** Qual matches each team plays at a district event. */
    matchesPerTeam: 12,
    /** District championship config. */
    dcmp: {
      teamCount: 55,
      matchesPerTeam: 10,
      /**
       * How strongly DCMP selection favors high-skill teams.
       * 1.0 = purely skill-ordered, 0.0 = random.
       * 0.8 means top teams almost always advance but with some variance.
       */
      skillBias: 0.8,
    },
  },

  // ── Scoring ────────────────────────────────────────────────────
  /** Points awarded per bucket value (index = bucket). */
  bucketPointValues: [0, 1, 2, 4, 6, 9],
  /** Points awarded per climb level (index = level). */
  climbPointValues: [0, 3, 6, 12],

  // ── Cycle generation ───────────────────────────────────────────
  cycles: {
    /** [min, max] total cycles per match. Interpolated by skill. */
    countRange: [1, 9] as [number, number],
    /** [slow, fast] dump duration in seconds. Inverted by skill. */
    dumpDurationRange: [35.0, 2.0] as [number, number],
    /** Max cycles during auto phase. */
    autoMaxCycles: 2,
    /**
     * Bucket weights by skill tier [low, mid, high].
     * Each is an array of weights for buckets 0-5.
     */
    bucketWeights: {
      low: [0.35, 0.35, 0.2, 0.08, 0.02, 0.0],
      mid: [0.1, 0.2, 0.3, 0.25, 0.1, 0.05],
      high: [0.02, 0.05, 0.15, 0.3, 0.28, 0.2],
    },
  },

  // ── Climb generation ───────────────────────────────────────────
  climb: {
    attemptBaseRate: 0.5,
    attemptSkillBonus: 0.48,
    successBaseRate: 0.2,
    successSkillBonus: 0.75,
    /** [slow, fast] climb duration in seconds. */
    durationRange: [35.0, 3.0] as [number, number],
    /** Climb level weights by skill tier. Index = level (0-3). */
    levelWeights: {
      low: [0.4, 0.45, 0.12, 0.03],
      mid: [0.1, 0.3, 0.4, 0.2],
      high: [0.02, 0.1, 0.38, 0.5],
    },
    /** Probability that the climb happens during auto (vs teleop). */
    autoClimbRate: 0.05,
  },

  // ── OOF / Break ────────────────────────────────────────────────
  oof: {
    /** Base probability of OOF at reliability=0. */
    baseRate: 0.25,
    /** Reduction per unit of reliability. At reliability=1: 0.25-0.22 = 0.03. */
    reliabilityReduction: 0.22,
    /** [min, max] OOF duration in seconds when it occurs. */
    durationRange: [5, 90] as [number, number],
  },

  // ── Pit form ───────────────────────────────────────────────────
  pit: {
    drivetrainWeights: {
      swerve: 0.8,
      tank: 0.1,
      mecanum: 0.07,
      other: 0.03,
    } as Record<string, number>,
    weightRange: [75, 155] as [number, number],
    capacityRange: [3, 65] as [number, number],
    shooterWeights: { turret: 0.4, fixed: 0.4, none: 0.2 } as Record<string, number>,
    /** Probability of each capability at skill=0 and skill=1. */
    capabilities: {
      canTrench: [0.15, 0.9] as [number, number],
      canBump: [0.25, 0.9] as [number, number],
      canShuttle: [0.1, 0.85] as [number, number],
      canShootWhileMoving: [0.05, 0.7] as [number, number],
    },
    climbTypeOptions: ["sides", "center", "left", "right", "any"] as const,
    /** Probability of having any climb capability, at [skill=0, skill=1]. */
    hasClimbRate: [0.25, 0.95] as [number, number],
  },

  // ── Drive ranking ──────────────────────────────────────────────
  driveRanking: {
    /** Gaussian noise std dev added to driverSkill when ranking. */
    noise: 0.15,
  },

  // ── Comments ───────────────────────────────────────────────────
  comments: {
    low: [
      "Robot had significant mechanical issues throughout the match. Struggled to complete cycles consistently.",
      "Multiple breakdowns during teleop. Team could not maintain scoring pace against opponents.",
      "Unreliable autonomous mode. Robot frequently stalled during cycle attempts and lost time.",
      "Difficulty with game piece pickup. Slow cycle times and several failed scoring attempts noted.",
      "Driver seemed inexperienced. Robot bumped walls frequently and had trouble navigating the field.",
      "Consistent issues with intake mechanism. Team spent most of teleop trying to recover from jams.",
    ],
    mid: [
      "Solid performance overall. Consistent cycle times but nothing spectacular. Good reliability.",
      "Decent robot with average scoring output. Autonomous mode worked about half the time correctly.",
      "Reliable operation throughout the match. Steady contributor but not a dominant force on the field.",
      "Good driving with occasional positioning errors. Scoring output was around the median for the event.",
      "Competent robot that fills its role. No major issues but also no standout moments in this match.",
      "Average cycle times with occasional burst of speed. Climb attempt was successful but slow.",
    ],
    high: [
      "Exceptional performance. Fast, consistent cycles with excellent autonomous scoring routine executed.",
      "Elite-level robot. Dominated scoring in this match with rapid cycle times and perfect endgame.",
      "Outstanding driver skill. Precise movements, fast cycles, and clutch endgame climb under pressure.",
      "World-class capabilities on display. Top scorer in the match with flawless mechanical operation.",
      "Incredible consistency. Every cycle was fast and accurate. This team is a top pick for eliminations.",
      "Dominant performance from start to finish. Strong auto, fast teleop cycles, and reliable endgame.",
    ],
  },
} as const;

export type GameConfig = typeof gameConfig;
