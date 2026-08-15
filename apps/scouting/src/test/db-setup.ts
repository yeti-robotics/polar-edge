import { sql } from "drizzle-orm";
import { afterAll, beforeEach, inject } from "vitest";

// Must be set before `@/lib/database` is imported: it builds its connection
// pool from DATABASE_URL at module scope. The URL points at the throwaway
// container started in db-global-setup.ts.
process.env.DATABASE_URL = inject("databaseUrl");

const { db } = await import("@/lib/database");

/**
 * The code under test opens its own transactions via `db.transaction(...)`, so
 * there is no seam to wrap a test in a rollback. Isolation is therefore done by
 * truncating every table between tests. The table list is read from the catalog
 * rather than hardcoded so it stays correct as the schema grows.
 */
beforeEach(async () => {
  const { rows } = await db.execute<{ tablename: string }>(sql`
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename not like '\\_\\_drizzle%'
  `);

  if (rows.length === 0) return;

  const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
  await db.execute(sql.raw(`truncate table ${tables} restart identity cascade`));
});

afterAll(async () => {
  // Without this the run completes but the process hangs on the open pool.
  await db.$client.end();
});
