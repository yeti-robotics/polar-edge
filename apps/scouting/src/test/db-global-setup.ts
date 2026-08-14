import path from "node:path";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { GlobalSetupContext } from "vitest/node";

declare module "vitest" {
  interface ProvidedContext {
    databaseUrl: string;
  }
}

let container: StartedPostgreSqlContainer;

/**
 * Runs once per `db` project test run, before any test file is loaded.
 *
 * Each run gets a throwaway Postgres container, migrated from empty. Nothing is
 * shared with the developer's own database, and no run can be polluted by state
 * left behind by a previous one.
 */
export async function setup({ provide }: GlobalSetupContext) {
  container = await new PostgreSqlContainer("postgres:17.0")
    .withDatabase("polar_edge_test")
    .withTmpFs({ "/var/lib/postgresql/data": "rw" })
    .start();

  const databaseUrl = container.getConnectionUri();

  process.env.DATABASE_URL = databaseUrl;
  const { db } = await import("@/lib/database");

  await migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), "./src/lib/database/drizzle"),
  });

  await db.$client.end();

  provide("databaseUrl", databaseUrl);
}

export async function teardown() {
  await container?.stop();
}
