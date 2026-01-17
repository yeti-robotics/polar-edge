import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Get the app root directory (drizzle-kit commands run from app root)
// Use process.cwd() which is more reliable for drizzle-kit
const appRoot = process.cwd();

// Load .env.local first (higher priority), then .env
dotenv.config({ path: path.join(appRoot, ".env.local") });
dotenv.config({ path: path.join(appRoot, ".env") });

export default defineConfig({
  out: "./src/lib/database/drizzle",
  schema: ["./src/lib/database/schema"],
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: temp
    url: process.env.DATABASE_URL!,
  },
});
