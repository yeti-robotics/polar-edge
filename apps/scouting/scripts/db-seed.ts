import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { reset, seed } from "drizzle-seed";
import * as schemaTables from "../src/lib/database/schema/tables";
import { faker } from "@faker-js/faker";
import { readFile } from "node:fs/promises";

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

type TeamMatchInsert = {
  matchId: string;
  teamNumber: number;
  alliance: Alliance;
  alliancePosition: number;
};

async function readTeamNames(): Promise<string[]> {
  const contents = await readFile(teamFilePath, "utf-8");
  const parsed = JSON.parse(contents) as Record<string, { name: string }>;
  return Object.values(parsed).map((item) => item.name);
}

function buildMatches(eventKey: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${eventKey}qm${index + 1}`,
    compLevel: "qm",
    setNumber: 1,
    matchNumber: index + 1,
    eventKey,
    winningAlliance: faker.helpers.arrayElement(allianceOptions),
  }));
}

function buildTeamMatches(matchId: string, teamNumbers: number[]): TeamMatchInsert[] {
  const selectedTeams = faker.helpers.arrayElements(teamNumbers, teamsPerMatch);
  const redTeams = selectedTeams.slice(0, allianceSize);
  const blueTeams = selectedTeams.slice(allianceSize);

  return [
    ...redTeams.map((teamNumber, index) =>
      createTeamMatch(matchId, teamNumber, "red", index + 1)
    ),
    ...blueTeams.map((teamNumber, index) =>
      createTeamMatch(matchId, teamNumber, "blue", index + 1)
    ),
  ];
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
        key: f.string({ isUnique: true }),
        eventName: f.string({ isUnique: true }),
        startDate: f.date(),
        endDate: f.date(),
      },
    },
  }));

  const events = await db
    .select({ key: schemaTables.event.key })
    .from(schemaTables.event);

  const mappedMatches = events.flatMap((eventRow) =>
    buildMatches(eventRow.key, matchesPerEvent)
  );

  await db.insert(schemaTables.match).values(mappedMatches);

  const teams = await db
    .select({ teamNumber: schemaTables.team.teamNumber })
    .from(schemaTables.team);
  const matches = await db
    .select({ id: schemaTables.match.id })
    .from(schemaTables.match);

  const teamNumbers = teams.map((team) => team.teamNumber);
  const teamMatches = matches.flatMap((match) =>
    buildTeamMatches(match.id, teamNumbers)
  );

  await db.insert(schemaTables.teamMatch).values(teamMatches);
}

function createTeamMatch(
  matchId: string,
  teamNumber: number,
  alliance: Alliance,
  alliancePosition: number
): TeamMatchInsert {
  return {
    matchId,
    teamNumber,
    alliance,
    alliancePosition,
  };
}

main();
