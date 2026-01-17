import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Pool } from "pg";

// Get the app root directory by going up one level from the scripts directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(appRoot, ".env.local") });
dotenv.config({ path: path.join(appRoot, ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function dropAllTables() {
  const client = await pool.connect();
  try {
    // Get all table names in the public schema
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    const tableNames = result.rows.map((row) => row.tablename);

    // Drop all tables with CASCADE to handle foreign key constraints
    for (const tableName of tableNames) {
      console.log(`Dropping table: ${tableName}`);
      await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    }

    if (tableNames.length > 0) {
      console.log(`Successfully dropped ${tableNames.length} table(s).`);
    }

    // Drop custom types
    const typeResult = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e'
    `);

    const typeNames = typeResult.rows.map((row) => row.typname);

    for (const typeName of typeNames) {
      console.log(`Dropping type: ${typeName}`);
      await client.query(`DROP TYPE IF EXISTS "${typeName}" CASCADE`);
    }

    if (typeNames.length > 0) {
      console.log(`Successfully dropped ${typeNames.length} type(s).`);
    }

    // Clear drizzle migrations table so migrations can be re-run
    const migrationsTableExists = await client
      .query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'drizzle' 
        AND table_name = '__drizzle_migrations'
      );
    `)
      .catch(() => ({ rows: [{ exists: false }] }));

    if (migrationsTableExists.rows[0].exists) {
      console.log("Clearing drizzle migrations table...");
      await client.query("DELETE FROM drizzle.__drizzle_migrations");
      console.log("Drizzle migrations table cleared!");
    }

    if (tableNames.length === 0 && typeNames.length === 0) {
      console.log("No tables or types to drop.");
    }
  } catch (error) {
    console.error("Error dropping tables:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

dropAllTables();
