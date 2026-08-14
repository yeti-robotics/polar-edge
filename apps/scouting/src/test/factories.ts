import { db } from "@/lib/database";
import {
  event,
  match,
  member,
  organization,
  organizationEvent,
  team,
  teamMatch,
  user,
} from "@/lib/database/schema";

/**
 * Factories for `*.db.test.ts`. Each one inserts against the real database and
 * returns the inserted row, so tests can state only the fields they care about.
 *
 * IDs are derived from a per-run counter rather than random values so failures
 * are reproducible.
 */
let seq = 0;
const next = () => ++seq;

export async function anEvent(overrides: Partial<typeof event.$inferInsert> = {}) {
  const n = next();
  const [row] = await db
    .insert(event)
    .values({
      eventCode: `test${n}`,
      name: `Test Event ${n}`,
      startDate: new Date("2026-03-01T00:00:00Z"),
      endDate: new Date("2026-03-03T00:00:00Z"),
      ...overrides,
    })
    .returning();

  if (!row) throw new Error("anEvent: insert returned no row");
  return row;
}

export async function aTeam(teamNumber: number, teamName = "") {
  const [row] = await db.insert(team).values({ teamNumber, teamName }).returning();
  if (!row) throw new Error("aTeam: insert returned no row");
  return row;
}

/**
 * Creates a qualification match and its six team_match slots, inserting any
 * teams that do not exist yet. `red` and `blue` are team numbers in position
 * order.
 */
export async function aMatch(opts: {
  eventId: string;
  matchNumber: number;
  red: [number, number, number];
  blue: [number, number, number];
  redScore?: number | null;
  blueScore?: number | null;
}) {
  const [row] = await db
    .insert(match)
    .values({
      eventId: opts.eventId,
      matchType: "qm",
      matchNumber: opts.matchNumber,
      redScore: opts.redScore ?? null,
      blueScore: opts.blueScore ?? null,
    })
    .returning();

  if (!row) throw new Error("aMatch: insert returned no row");

  const slots = [
    ...opts.red.map((teamNumber, i) => ({ teamNumber, alliance: "red" as const, position: i + 1 })),
    ...opts.blue.map((teamNumber, i) => ({
      teamNumber,
      alliance: "blue" as const,
      position: i + 1,
    })),
  ];

  await db
    .insert(team)
    .values(slots.map((s) => ({ teamNumber: s.teamNumber })))
    .onConflictDoNothing();

  await db.insert(teamMatch).values(
    slots.map((s) => ({
      eventId: opts.eventId,
      matchId: row.id,
      teamNumber: s.teamNumber,
      alliance: s.alliance,
      position: s.position,
    }))
  );

  return row;
}

/**
 * Creates an organization with one member, optionally marking `eventId` as the
 * organization's active event.
 */
export async function anOrganization(opts: { activeEventId?: string; role?: string } = {}) {
  const n = next();

  const [org] = await db
    .insert(organization)
    .values({
      id: `org-${n}`,
      name: `Test Org ${n}`,
      slug: `test-org-${n}`,
      createdAt: new Date(),
    })
    .returning();

  const [usr] = await db
    .insert(user)
    .values({
      id: `user-${n}`,
      name: `Test User ${n}`,
      email: `user-${n}@example.com`,
    })
    .returning();

  if (!org || !usr) throw new Error("anOrganization: insert returned no row");

  const [mbr] = await db
    .insert(member)
    .values({
      id: `member-${n}`,
      organizationId: org.id,
      userId: usr.id,
      role: opts.role ?? "admin",
      createdAt: new Date(),
    })
    .returning();

  if (!mbr) throw new Error("anOrganization: member insert returned no row");

  if (opts.activeEventId) {
    await db
      .insert(organizationEvent)
      .values({ organizationId: org.id, eventId: opts.activeEventId, isActive: true });
  }

  return { organization: org, user: usr, member: mbr };
}
