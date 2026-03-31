/**
 * Adds your user account to the "Seed Organization" as an owner.
 *
 * Usage:
 *   pnpm join:seed <your-email>
 *
 * You must have already signed in via Discord at least once
 * so your user record exists in the database.
 */
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(appRoot, ".env.local") });
dotenv.config({ path: path.join(appRoot, ".env") });

const email = process.argv[2];
if (!email) {
  console.error("Usage: pnpm join:seed <your-email>");
  process.exit(1);
}

async function main() {
  const { db } = await import("@/lib/database");
  const { eq, and } = await import("drizzle-orm");
  const { user, member, organization, session } = await import(
    "../src/lib/database/schema/tables"
  );

  // Find user
  const userRow = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.email, email!.toLowerCase()))
    .limit(1);

  if (!userRow[0]) {
    console.error(`No user found with email "${email}". Sign in via Discord first.`);
    process.exit(1);
  }

  // Find seed org
  const orgRow = await db
    .select({ id: organization.id, name: organization.name })
    .from(organization)
    .where(eq(organization.slug, "seed-org"))
    .limit(1);

  if (!orgRow[0]) {
    console.error('Seed Organization not found. Run "pnpm db:seed" first.');
    process.exit(1);
  }

  // Check if already a member
  const existing = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.userId, userRow[0].id), eq(member.organizationId, orgRow[0].id)))
    .limit(1);

  if (existing[0]) {
    console.log(`${userRow[0].name} is already a member of ${orgRow[0].name}.`);
  } else {
    await db.insert(member).values({
      id: randomBytes(16).toString("hex"),
      organizationId: orgRow[0].id,
      userId: userRow[0].id,
      role: "owner",
      createdAt: new Date(),
    });
    console.log(`Added ${userRow[0].name} as owner of ${orgRow[0].name}.`);
  }

  // Set active org on all their sessions
  const updated = await db
    .update(session)
    .set({ activeOrganizationId: orgRow[0].id })
    .where(eq(session.userId, userRow[0].id));

  console.log("Active organization set to Seed Organization on all sessions.");
  console.log("Refresh the page — you should see it in the org selector.");

  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
