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
const teamFile = path.resolve(__dirname, "teams.json")

// Load environment variables BEFORE importing database (which uses DATABASE_URL)
dotenv.config({ path: path.join(appRoot, ".env.local") });
dotenv.config({ path: path.join(appRoot, ".env") });

async function getTeamNames() {
  try {
    const contents = await readFile(teamFile, 'utf-8')
    const parsed = JSON.parse(contents) as Record<string, { name: string }>

    return Object.values(parsed).map((item) => item.name)
  } catch (err) {
    throw new Error("Couldn't read teams!")
  }
}

async function main() {
  // Import after env vars are loaded
  const { db } = await import("@/lib/database");

  // Use the organized schema export - includes all tables and enums, excludes relations

  await reset(db, schemaTables);
  // This ensures proper type inference in drizzle-seed

  const teamNames = await getTeamNames()

  await seed(db, schemaTables).refine(f => ({
    team: {
      count: 150,
      columns: {
        teamName: f.valuesFromArray({ values: teamNames, isUnique: true}),
        teamNumber: f.int({ minValue: 1, maxValue: 11500, isUnique: true })
      }
    },

    event: {
      count: 10, with: {match: 85},
      columns: {
        key: f.string({ isUnique: true }),
        name: f.string({ isUnique: true }),
        startDate: f.date(),
        endDate: f.date()
      }
    },

    match: {
      columns: {
        id: f.string(),
        compLevel: f.default({ defaultValue: 'qm' }),
        setNumber: f.default({ defaultValue: 1 }),
        matchNumber: f.int({ minValue: 1, maxValue: 121 }),
        winningAlliance: f.valuesFromArray({ values: ["red", "blue"] })
      }
      }
    }))
  }

main();
