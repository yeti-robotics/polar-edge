import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { reset, seed } from "drizzle-seed";
import * as schemaTables from "../src/lib/database/schema/tables";

// Get the app root directory by going up one level from the scripts directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");

// Load environment variables BEFORE importing database (which uses DATABASE_URL)
dotenv.config({ path: path.join(appRoot, ".env.local") });
dotenv.config({ path: path.join(appRoot, ".env") });

async function main() {
  // Import after env vars are loaded
  const { db } = await import("@/lib/database");

  // Use the organized schema export - includes all tables and enums, excludes relations

  await reset(db, schemaTables);
  // This ensures proper type inference in drizzle-seed
  await seed(db, schemaTables);
}

main();
