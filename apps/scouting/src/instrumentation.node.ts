import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@/lib/database";

const migrationsFolder = path.join(process.cwd(), "./src/lib/database/drizzle");

await migrate(db, { migrationsFolder });
