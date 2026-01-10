import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./lib/database/drizzle",
  schema: ["./src/lib/database/schema.ts", "./src/lib/database/auth-schema.ts"],
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: temp
    url: process.env.DATABASE_URL!,
  },
});
