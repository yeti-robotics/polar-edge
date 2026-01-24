import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
import { reset, seed } from "drizzle-seed";
import type { db } from "@/lib/database";
import * as schemaTables from "../src/lib/database/schema/tables";
import { climb } from "../src/lib/database/schema/tables/climb";
import { cycle } from "../src/lib/database/schema/tables/cycle";
import { pitForm } from "../src/lib/database/schema/tables/pit-form";
import { standForm } from "../src/lib/database/schema/tables/stand_form";

// Get the app root directory by going up one level from the scripts directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const teamFilePath = path.resolve(__dirname, "teams.json");
const matchesPerEvent = 85;
const teamsPerMatch = 6;
const allianceSize = 3;
const allianceOptions = ["red", "blue"] as const;

// Load environment variables BEFORE importing database (which uses DATABASE_URL)
dotenv.config({ path: path.join(appRoot, ".env.local") });
dotenv.config({ path: path.join(appRoot, ".env") });

type Alliance = (typeof allianceOptions)[number];
type SkillLevel = 1 | 2 | 3 | 4 | 5;

type TeamMatchInsert = {
  eventId: string;
  matchId: string;
  teamNumber: number;
  alliance: Alliance;
  position: number;
};

async function readTeamNames(): Promise<string[]> {
  const contents = await readFile(teamFilePath, "utf-8");
  const parsed = JSON.parse(contents) as Record<string, { name: string }>;
  return Object.values(parsed).map((item) => item.name);
}

// Skill-based helper functions
function assignSkillLevels(teamNumbers: number[]): Map<number, SkillLevel> {
  const skillMap = new Map<number, SkillLevel>();
  const shuffled = [...teamNumbers].sort(() => Math.random() - 0.5);

  // Distribute evenly: 20% each level
  const levelCount = Math.floor(teamNumbers.length / 5);
  const remainder = teamNumbers.length % 5;

  let index = 0;
  for (let level = 1; level <= 5; level++) {
    const count = levelCount + (level <= remainder ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const teamNumber = shuffled[index];
      if (teamNumber !== undefined) {
        skillMap.set(teamNumber, level as SkillLevel);
        index++;
      }
    }
  }

  return skillMap;
}

function getCycleCount(skillLevel: SkillLevel): number {
  // Level 1: 2-4 cycles, Level 3: 4-6 cycles, Level 5: 6-8 cycles
  const minCycles = [2, 2, 4, 5, 6][skillLevel - 1];
  const maxCycles = [4, 4, 6, 7, 8][skillLevel - 1];
  return faker.number.int({ min: minCycles, max: maxCycles });
}

function getBucket(skillLevel: SkillLevel): number {
  // Higher skill = more higher bucket numbers
  // Level 1: mostly 0-1, Level 3: mix, Level 5: mostly 2-3
  const weights = [
    [0.5, 0.4, 0.08, 0.02], // Level 1
    [0.3, 0.4, 0.25, 0.05], // Level 2
    [0.15, 0.35, 0.4, 0.1], // Level 3
    [0.05, 0.25, 0.5, 0.2], // Level 4
    [0.02, 0.18, 0.5, 0.3], // Level 5
  ];

  const weight = weights[skillLevel - 1];
  if (!weight) return 0;

  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < 4; i++) {
    const w = weight[i];
    if (w !== undefined) {
      cumulative += w;
      if (rand <= cumulative) return i;
    }
  }
  return 3;
}

function getDumpDuration(skillLevel: SkillLevel): string {
  const ranges = [
    [20.0, 30.0], // Level 1
    [12.0, 18.0], // Level 2
    [4.0, 8.0], // Level 3
    [3.0, 6.0], // Level 4
    [2.0, 5.0], // Level 5
  ];

  const range = ranges[skillLevel - 1];
  if (!range) {
    const defaultRange = ranges[2];
    if (!defaultRange) {
      return faker.number.float({ min: 4.0, max: 8.0, fractionDigits: 2 }).toString();
    }
    const [min, max] = defaultRange;
    return faker.number.float({ min, max, fractionDigits: 2 }).toString();
  }
  const [min, max] = range;
  return faker.number.float({ min, max, fractionDigits: 2 }).toString();
}

function getClimbAttemptRate(skillLevel: SkillLevel): number {
  // Level 1: 60%, Level 3: 80%, Level 5: 95%
  const rates = [0.6, 0.7, 0.8, 0.9, 0.95];
  return rates[skillLevel - 1] ?? 0.8;
}

function getClimbSuccessRate(skillLevel: SkillLevel): number {
  // Level 1: 30%, Level 3: 60%, Level 5: 90%
  const rates = [0.3, 0.4, 0.6, 0.75, 0.9];
  return rates[skillLevel - 1] ?? 0.6;
}

function getClimbLevel(skillLevel: SkillLevel): number {
  // Higher skill = higher climb levels (0-3)
  // Level 1: mostly 0-1, Level 3: mix, Level 5: mostly 2-3
  const weights = [
    [0.4, 0.5, 0.08, 0.02], // Level 1
    [0.25, 0.5, 0.2, 0.05], // Level 2
    [0.1, 0.4, 0.4, 0.1], // Level 3
    [0.05, 0.3, 0.5, 0.15], // Level 4
    [0.02, 0.18, 0.5, 0.3], // Level 5
  ];

  const weight = weights[skillLevel - 1];
  if (!weight) return 1;

  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < 4; i++) {
    const w = weight[i];
    if (w !== undefined) {
      cumulative += w;
      if (rand <= cumulative) return i;
    }
  }
  return 3;
}

function getClimbDuration(skillLevel: SkillLevel): string {
  // Lower skill = longer durations, higher skill = shorter durations
  // Level 1: 15-30s, Level 3: 10-20s, Level 5: 5-15s
  const ranges = [
    [15, 30], // Level 1
    [12, 25], // Level 2
    [10, 20], // Level 3
    [7, 18], // Level 4
    [5, 15], // Level 5
  ];

  const range = ranges[skillLevel - 1];
  if (!range) {
    const defaultRange = ranges[2];
    if (!defaultRange) {
      return faker.number.float({ min: 10, max: 20, fractionDigits: 2 }).toString();
    }
    const [min, max] = defaultRange;
    return faker.number.float({ min, max, fractionDigits: 2 }).toString();
  }
  const [min, max] = range;
  return faker.number.float({ min, max, fractionDigits: 2 }).toString();
}

function getDidBreakProbability(skillLevel: SkillLevel): number {
  // Level 1: 30%, Level 3: 15%, Level 5: 5%
  const probabilities = [0.3, 0.25, 0.15, 0.1, 0.05];
  return probabilities[skillLevel - 1] ?? 0.15;
}

function getComments(skillLevel: SkillLevel): string {
  // Higher skill = more detailed comments
  const commentTemplates = [
    // Level 1
    ["Robot had issues", "Struggled with consistency", "Multiple breakdowns", "Needs improvement"],
    // Level 2
    ["Decent performance", "Some inconsistencies", "Average robot", "Room for improvement"],
    // Level 3
    [
      "Solid performance overall",
      "Consistent cycles",
      "Good robot capabilities",
      "Reliable operation",
    ],
    // Level 4
    [
      "Strong performance with good consistency",
      "Excellent cycle times",
      "Very capable robot",
      "High reliability",
    ],
    // Level 5
    [
      "Exceptional performance with outstanding consistency",
      "Elite robot with fast cycles",
      "World-class capabilities",
      "Flawless operation",
    ],
  ];

  const templates = commentTemplates[skillLevel - 1];
  if (!templates) {
    return commentTemplates[2]?.[0] ?? "Average performance";
  }
  return faker.helpers.arrayElement(templates);
}

// Pit form helper functions
function getDrivetrainType(): "tank" | "swerve" | "mecanum" | "other" {
  const types: Array<"tank" | "swerve" | "mecanum" | "other"> = [
    "tank",
    "swerve",
    "mecanum",
    "other",
  ];
  // 80% or more will be swerve, then tank, then mecanum, then other
  const weights = [0.1, 0.8, 0.07, 0.03];
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    const weight = weights[i];
    if (weight !== undefined) {
      cumulative += weight;
      if (rand <= cumulative) {
        const type = types[i];
        if (type) return type;
      }
    }
  }
  return "swerve";
}

function getCapacity(skillLevel: SkillLevel): number {
  // Higher skill = higher capacity (target 20-60 balls for good teams)
  const ranges: Array<[number, number]> = [
    [5, 15], // Level 1
    [10, 20], // Level 2
    [15, 30], // Level 3
    [20, 45], // Level 4
    [20, 60], // Level 5 - target 20-60 balls
  ];
  const range = ranges[skillLevel - 1] ?? ranges[2] ?? [15, 30];
  return faker.number.int({ min: range[0], max: range[1] });
}

function getWeight(skillLevel: SkillLevel): number {
  // Higher skill teams might have more optimized (lighter) robots, but also more features
  // Generally 80-150 lbs range
  const ranges: Array<[number, number]> = [
    [90, 150], // Level 1 - heavier, less optimized
    [85, 140], // Level 2
    [80, 130], // Level 3
    [80, 125], // Level 4
    [80, 120], // Level 5 - more optimized
  ];
  const range = ranges[skillLevel - 1] ?? ranges[2] ?? [80, 130];
  return faker.number.int({ min: range[0], max: range[1] });
}

function getClimbType(
  skillLevel: SkillLevel
): "sides" | "center" | "left" | "right" | "any" | null {
  // Higher skill = more likely to have climb capability
  const climbRates = [0.3, 0.5, 0.7, 0.85, 0.95]; // Probability of having climb
  const hasClimb = Math.random() < (climbRates[skillLevel - 1] ?? 0.7);

  if (!hasClimb) return null;

  const types: Array<"sides" | "center" | "left" | "right" | "any"> = [
    "sides",
    "center",
    "left",
    "right",
    "any",
  ];
  // "any" is most common for good teams, then "sides", then others
  const weights: Array<Array<number>> = [
    [0.1, 0.2, 0.1, 0.1, 0.5], // Level 1
    [0.15, 0.25, 0.15, 0.15, 0.3], // Level 2
    [0.2, 0.3, 0.15, 0.15, 0.2], // Level 3
    [0.25, 0.35, 0.15, 0.15, 0.1], // Level 4
    [0.3, 0.4, 0.15, 0.15, 0.0], // Level 5
  ];

  const weight = weights[skillLevel - 1] ?? weights[2];
  if (!weight) return "sides";
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weight.length; i++) {
    cumulative += weight[i] ?? 0;
    if (rand <= cumulative) {
      const type = types[i];
      if (type) return type;
    }
  }
  return "sides";
}

function getCanTrench(skillLevel: SkillLevel): boolean {
  // Higher skill = more likely to be able to trench
  const probabilities = [0.2, 0.35, 0.5, 0.7, 0.85];
  return Math.random() < (probabilities[skillLevel - 1] ?? 0.5);
}

function getCanBump(skillLevel: SkillLevel): boolean {
  // Higher skill = more likely to be able to bump
  const probabilities = [0.3, 0.45, 0.6, 0.75, 0.9];
  return Math.random() < (probabilities[skillLevel - 1] ?? 0.6);
}

function getCanShuttle(skillLevel: SkillLevel): boolean {
  // Higher skill = more likely to be able to shuttle
  const probabilities = [0.1, 0.25, 0.4, 0.6, 0.8];
  return Math.random() < (probabilities[skillLevel - 1] ?? 0.4);
}

function buildMatches(eventId: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    eventId,
    matchType: "qm" as const,
    matchNumber: index + 1,
    redScore: faker.number.int({ min: 0, max: 200 }),
    blueScore: faker.number.int({ min: 0, max: 200 }),
  }));
}

function buildTeamMatches(
  eventId: string,
  matchId: string,
  teamNumbers: number[]
): TeamMatchInsert[] {
  const selectedTeams = faker.helpers.arrayElements(teamNumbers, teamsPerMatch);
  const redTeams = selectedTeams.slice(0, allianceSize);
  const blueTeams = selectedTeams.slice(allianceSize);

  return [
    ...redTeams.map((teamNumber, index) =>
      createTeamMatch(eventId, matchId, teamNumber, "red", index + 1)
    ),
    ...blueTeams.map((teamNumber, index) =>
      createTeamMatch(eventId, matchId, teamNumber, "blue", index + 1)
    ),
  ];
}

// Helper function to batch inserts to avoid stack overflow
async function batchInsert<T>(
  database: typeof db,
  table: (typeof schemaTables)[keyof typeof schemaTables],
  values: T[],
  batchSize: number = 1000
): Promise<void> {
  if (values.length === 0) return;

  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    await database.insert(table).values(batch);
  }
}

async function main() {
  // Import after env vars are loaded
  const { db } = await import("@/lib/database");

  // Use the organized schema export - includes all tables and enums, excludes relations

  await reset(db, schemaTables);
  // This ensures proper type inference in drizzle-seed

  const teamNames = await readTeamNames();
  const { team, event } = schemaTables;

  await seed(db, { team, event }).refine((f) => ({
    team: {
      count: 150,
      columns: {
        teamName: f.valuesFromArray({ values: teamNames, isUnique: true }),
        teamNumber: f.int({ minValue: 1, maxValue: 11500, isUnique: true }),
      },
    },
    event: {
      count: 10,
      columns: {
        eventCode: f.string({ isUnique: true }),
        name: f.string({ isUnique: true }),
        startDate: f.date(),
        endDate: f.date(),
      },
    },
  }));

  const events = await db
    .select({ id: schemaTables.event.id, eventCode: schemaTables.event.eventCode })
    .from(schemaTables.event);

  const mappedMatches = events.flatMap((eventRow) => buildMatches(eventRow.id, matchesPerEvent));

  await batchInsert(db, schemaTables.match, mappedMatches);

  const teams = await db
    .select({ teamNumber: schemaTables.team.teamNumber })
    .from(schemaTables.team);
  const matches = await db
    .select({ id: schemaTables.match.id, eventId: schemaTables.match.eventId })
    .from(schemaTables.match);

  const teamNumbers = teams.map((team) => team.teamNumber);
  const teamMatches = matches.flatMap((match) =>
    buildTeamMatches(match.eventId, match.id, teamNumbers)
  );

  await batchInsert(db, schemaTables.teamMatch, teamMatches);

  // Assign skill levels to teams
  const skillLevels = assignSkillLevels(teamNumbers);

  // Generate pit forms for all teams
  const pitForms = teams.map((team) => {
    const skillLevel = skillLevels.get(team.teamNumber) ?? 3;
    return {
      teamNumber: team.teamNumber,
      scoutMemberId: null,
      drivetrainType: getDrivetrainType(),
      canTrench: getCanTrench(skillLevel),
      canBump: getCanBump(skillLevel),
      canShuttle: getCanShuttle(skillLevel),
      capacity: getCapacity(skillLevel),
      weight: getWeight(skillLevel),
      climbType: getClimbType(skillLevel),
    };
  });

  await batchInsert(db, pitForm, pitForms);

  // Generate stand forms for all team matches
  const teamMatchesForForms = await db
    .select({
      id: schemaTables.teamMatch.id,
      teamNumber: schemaTables.teamMatch.teamNumber,
    })
    .from(schemaTables.teamMatch);

  const standForms = teamMatchesForForms.map((teamMatch) => {
    const skillLevel = skillLevels.get(teamMatch.teamNumber) ?? 3;
    return {
      teamMatchId: teamMatch.id,
      scoutMemberId: null,
      comments: getComments(skillLevel),
      didBreak: Math.random() < getDidBreakProbability(skillLevel),
    };
  });

  await batchInsert(db, standForm, standForms);

  // Get all stand forms with their team numbers for cycle/climb generation
  const standFormsWithTeams = await db
    .select({
      id: standForm.id,
      teamMatchId: standForm.teamMatchId,
    })
    .from(standForm);

  // Get team numbers for each stand form
  const teamMatchToTeamNumber = new Map(teamMatchesForForms.map((tm) => [tm.id, tm.teamNumber]));

  // Generate cycles for each stand form
  const allCycles: Array<{
    standFormId: string;
    phase: "auto" | "teleop";
    cycleNumber: number;
    bucket: number;
    dumpDuration: string;
  }> = [];

  for (const standForm of standFormsWithTeams) {
    const teamNumber = teamMatchToTeamNumber.get(standForm.teamMatchId);
    if (!teamNumber) continue;

    const skillLevel = skillLevels.get(teamNumber) ?? 3;
    const cycleCount = getCycleCount(skillLevel);

    // Determine phase distribution: 20% auto, 80% teleop
    const autoCycles = Math.floor(cycleCount * 0.2);
    const teleopCycles = cycleCount - autoCycles;

    // Generate auto cycles
    for (let i = 1; i <= autoCycles; i++) {
      allCycles.push({
        standFormId: standForm.id,
        phase: "auto",
        cycleNumber: i,
        bucket: getBucket(skillLevel),
        dumpDuration: getDumpDuration(skillLevel),
      });
    }

    // Generate teleop cycles
    for (let i = 1; i <= teleopCycles; i++) {
      allCycles.push({
        standFormId: standForm.id,
        phase: "teleop",
        cycleNumber: autoCycles + i,
        bucket: getBucket(skillLevel),
        dumpDuration: getDumpDuration(skillLevel),
      });
    }
  }

  await batchInsert(db, cycle, allCycles);

  // Generate climbs for stand forms
  const allClimbs: Array<{
    standFormId: string;
    climbLevel: number;
    climbSuccess: boolean;
    climbDuration: string;
    climbPhase: "auto" | "teleop";
  }> = [];

  for (const standForm of standFormsWithTeams) {
    const teamNumber = teamMatchToTeamNumber.get(standForm.teamMatchId);
    if (!teamNumber) continue;

    const skillLevel = skillLevels.get(teamNumber) ?? 3;
    const attemptRate = getClimbAttemptRate(skillLevel);

    // Determine if team attempts climb
    if (Math.random() < attemptRate) {
      const successRate = getClimbSuccessRate(skillLevel);
      const climbSuccess = Math.random() < successRate;
      const climbLevel = climbSuccess ? getClimbLevel(skillLevel) : 0;

      // Mostly teleop climbs (95%), some auto (5%)
      const climbPhase = Math.random() < 0.95 ? "teleop" : "auto";

      allClimbs.push({
        standFormId: standForm.id,
        climbLevel,
        climbSuccess,
        climbDuration: getClimbDuration(skillLevel),
        climbPhase,
      });
    }
  }

  await batchInsert(db, climb, allClimbs);
}

function createTeamMatch(
  eventId: string,
  matchId: string,
  teamNumber: number,
  alliance: Alliance,
  position: number
): TeamMatchInsert {
  return {
    eventId,
    matchId,
    teamNumber,
    alliance,
    position,
  };
}

main();
