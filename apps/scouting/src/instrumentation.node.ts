import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@/lib/database";

const migrationsFolder = path.join(process.cwd(), "./src/lib/database/drizzle");

await migrate(db, { migrationsFolder });

if (!process.env.ADMIN_EMAILS) {
  console.warn(
    "[permissions] ADMIN_EMAILS is not set. No super admins will be recognized and organization creation will be disabled."
  );
}
