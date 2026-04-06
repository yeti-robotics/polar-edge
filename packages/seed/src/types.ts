/** A team's simulation profile — drives all probabilistic outcomes. */
export type TeamProfile = {
  teamNumber: number;
  /** Overall robot capability, 0-1 (exponentially distributed). */
  skill: number;
  /** Driver ability, independent of robot. Affects drive team rankings. */
  driverSkill: number;
  /** Mechanical reliability. Affects OOF/break probability. */
  reliability: number;
  /** Climb-specific ability. Affects climb success rate. */
  climbAbility: number;
};

export type Alliance = "red" | "blue";
export type Phase = "auto" | "teleop";
export type MatchType = "qm" | "ef" | "qf" | "sf" | "f";

/** A simulated match in the schedule. */
export type SimulatedMatch = {
  matchNumber: number;
  matchType: MatchType;
  red: { teamNumber: number; position: number }[];
  blue: { teamNumber: number; position: number }[];
};

/** Output of simulating one team's performance in a match. */
export type SimulatedTeamMatch = {
  teamNumber: number;
  cycles: SimulatedCycle[];
  /** Scout-observed climb timing (duration only). */
  climb: SimulatedClimb | null;
  /** TBA-sourced climb outcome (level achieved). */
  climbOutcome: SimulatedClimbOutcome;
  oofTimeSeconds: number;
  comments: string;
  /** Points scored by this team (sum of cycle + climb points). */
  points: number;
};

export type SimulatedCycle = {
  phase: Phase;
  cycleNumber: number;
  dumpDuration: number;
};

export type SimulatedClimb = {
  phase: Phase;
  climbDuration: number;
};

/** TBA-sourced climb outcome for a team in a match. */
export type SimulatedClimbOutcome = {
  autoClimbLevel: number; // 0=None, 1=L1, 2=L2, 3=L3
  endgameClimbLevel: number; // 0=None, 1=L1, 2=L2, 3=L3
};

/** A fully simulated match with derived scores. */
export type SimulatedMatchResult = {
  matchNumber: number;
  matchType: MatchType;
  redTeams: SimulatedTeamMatch[];
  blueTeams: SimulatedTeamMatch[];
  redScore: number;
  blueScore: number;
};

/** Drive team ranking for one alliance in one match. */
export type SimulatedDriveRanking = {
  matchNumber: number;
  alliance: Alliance;
  /** Team numbers ordered by rank: index 0 = rank 1 (best). */
  rankedTeams: number[];
};

/** Pit form data for one team. */
export type SimulatedPitForm = {
  teamNumber: number;
  drivetrainType: "tank" | "swerve" | "mecanum" | "other";
  canTrench: boolean;
  canBump: boolean;
  canShuttle: boolean;
  capacity: number;
  weight: number;
  climbType: "sides" | "center" | "left" | "right" | "any" | null;
  shooterType: "turret" | "fixed" | null;
  canShootWhileMoving: boolean;
};

/** Complete simulation output for one event. */
export type SimulatedEvent = {
  eventIndex: number;
  matches: SimulatedMatchResult[];
  driveRankings: SimulatedDriveRanking[];
};

/** Complete simulation output. */
export type SimulationResult = {
  teamProfiles: TeamProfile[];
  events: SimulatedEvent[];
  pitForms: SimulatedPitForm[];
};
