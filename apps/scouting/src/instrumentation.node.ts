import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/lib/database";

const migrationsFolder = path.join(process.cwd(), "./src/lib/database/drizzle");
const migrationLockKey = [2026, 20];

const client = await pool.connect();

try {
  await client.query("SELECT pg_advisory_lock($1, $2)", migrationLockKey);
  await migrate(db, { migrationsFolder });
} finally {
  await client.query("SELECT pg_advisory_unlock($1, $2)", migrationLockKey);
  client.release();
}

if (!process.env.ADMIN_EMAILS) {
  console.warn(
    "[permissions] ADMIN_EMAILS is not set. No super admins will be recognized and organization creation will be disabled."
  );
}
