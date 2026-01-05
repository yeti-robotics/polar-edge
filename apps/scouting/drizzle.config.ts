import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./lib/database/drizzle",
	schema: "./lib/database/schema.ts",
	dialect: "postgresql",
	casing: "snake_case",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
