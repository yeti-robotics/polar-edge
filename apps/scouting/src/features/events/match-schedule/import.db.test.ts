import { asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/database";
import { match, tbaMatchBreakdown, teamMatch, workabilityForm } from "@/lib/database/schema";
import { anOrganization } from "@/test/factories";
import type { MatchSchedule } from "./types";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { importMatchSchedule } from "./import";

const event = {
  mode: "create-or-update" as const,
  eventCode: "2026test",
  name: "Test Event",
  startDate: new Date("2026-03-01T00:00:00Z"),
  endDate: new Date("2026-03-03T00:00:00Z"),
};

function scheduledMatch(
  matchNumber: number,
  teams: [number, number, number, number, number, number]
): MatchSchedule["matches"][number] {
  return {
    matchNumber,
    matchType: "qm" as const,
    slots: [
      { teamNumber: teams[0], alliance: "red" as const, position: 1 as const },
      { teamNumber: teams[1], alliance: "red" as const, position: 2 as const },
      { teamNumber: teams[2], alliance: "red" as const, position: 3 as const },
      { teamNumber: teams[3], alliance: "blue" as const, position: 1 as const },
      { teamNumber: teams[4], alliance: "blue" as const, position: 2 as const },
      { teamNumber: teams[5], alliance: "blue" as const, position: 3 as const },
    ],
  };
}

function schedule(matches: MatchSchedule["matches"]): MatchSchedule {
  return { event, matches };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("importMatchSchedule", () => {
  it("removes matches missing from a replacement schedule", async () => {
    await importMatchSchedule(
      schedule([scheduledMatch(1, [1, 2, 3, 4, 5, 6]), scheduledMatch(2, [7, 8, 9, 10, 11, 12])])
    );

    await importMatchSchedule(schedule([scheduledMatch(1, [1, 2, 3, 4, 5, 6])]));

    const matches = await db.select().from(match);
    const assignments = await db.select().from(teamMatch);

    expect(matches.map(({ matchNumber }) => matchNumber)).toEqual([1]);
    expect(assignments).toHaveLength(6);
  });

  it("removes a team that moved out of a match while keeping the match id", async () => {
    await importMatchSchedule(schedule([scheduledMatch(1, [3506, 2, 3, 4, 5, 6])]));
    const [originalMatch] = await db.select().from(match);

    await importMatchSchedule(schedule([scheduledMatch(1, [1234, 2, 3, 4, 5, 6])]));

    const [savedMatch] = await db.select().from(match);
    const assignments = await db
      .select({ teamNumber: teamMatch.teamNumber })
      .from(teamMatch)
      .orderBy(asc(teamMatch.teamNumber));

    expect(savedMatch?.id).toBe(originalMatch?.id);
    expect(assignments.map(({ teamNumber }) => teamNumber)).toEqual([2, 3, 4, 5, 6, 1234]);
  });

  it("does not remove match types that are absent from the import", async () => {
    const result = await importMatchSchedule(schedule([scheduledMatch(1, [1, 2, 3, 4, 5, 6])]));
    await db.insert(match).values({
      eventId: result.eventId,
      matchType: "f",
      matchNumber: 1,
    });

    await importMatchSchedule(schedule([scheduledMatch(2, [7, 8, 9, 10, 11, 12])]));

    const matches = await db
      .select({ matchNumber: match.matchNumber, matchType: match.matchType })
      .from(match)
      .orderBy(asc(match.matchType));

    expect(matches).toHaveLength(2);
    expect(matches).toEqual(
      expect.arrayContaining([
        { matchNumber: 1, matchType: "f" },
        { matchNumber: 2, matchType: "qm" },
      ])
    );
  });

  it("reports the database row count and defaults missing surrogate values to false", async () => {
    const importedMatch = scheduledMatch(1, [1, 2, 3, 4, 5, 6]);
    const firstSlot = importedMatch.slots[0];
    if (!firstSlot) throw new Error("Expected first slot");
    firstSlot.surrogate = true;

    const result = await importMatchSchedule(schedule([importedMatch]));
    const assignments = await db
      .select({ teamNumber: teamMatch.teamNumber, surrogate: teamMatch.surrogate })
      .from(teamMatch);

    expect(result.teamMatchCount).toBe(6);
    expect(assignments.find(({ teamNumber }) => teamNumber === 1)?.surrogate).toBe(true);
    expect(assignments.find(({ teamNumber }) => teamNumber === 2)?.surrogate).toBe(false);
  });

  it("rolls back when an obsolete team assignment has saved data", async () => {
    await importMatchSchedule(schedule([scheduledMatch(1, [3506, 2, 3, 4, 5, 6])]));
    const [assignment] = await db.select().from(teamMatch).where(eq(teamMatch.teamNumber, 3506));

    if (!assignment) throw new Error("Expected team assignment");
    await db.insert(tbaMatchBreakdown).values({ teamMatchId: assignment.id });

    await expect(
      importMatchSchedule(schedule([scheduledMatch(1, [1234, 2, 3, 4, 5, 6])]))
    ).rejects.toThrow("saved data exists for qm1");

    const assignments = await db.select().from(teamMatch);
    expect(assignments).toHaveLength(6);
    expect(assignments.some(({ teamNumber }) => teamNumber === 3506)).toBe(true);
    expect(assignments.some(({ teamNumber }) => teamNumber === 1234)).toBe(false);
  });

  it("does not cascade-delete scouting data from a removed match", async () => {
    const result = await importMatchSchedule(
      schedule([scheduledMatch(1, [1, 2, 3, 4, 5, 6]), scheduledMatch(2, [7, 8, 9, 10, 11, 12])])
    );
    const [, removedMatch] = await db.select().from(match).orderBy(asc(match.matchNumber));
    const { member } = await anOrganization();

    if (!removedMatch) throw new Error("Expected match 2");
    await db.insert(workabilityForm).values({
      eventId: result.eventId,
      matchId: removedMatch.id,
      teamNumber: 7,
      scoutMemberId: member.id,
      role: "driver",
      rating: 5,
    });

    await expect(
      importMatchSchedule(schedule([scheduledMatch(1, [1, 2, 3, 4, 5, 6])]))
    ).rejects.toThrow("saved data exists for qm2");

    expect(await db.select().from(match)).toHaveLength(2);
    expect(await db.select().from(workabilityForm)).toHaveLength(1);
  });

  it("treats an empty schedule as a no-op", async () => {
    await importMatchSchedule(schedule([scheduledMatch(1, [1, 2, 3, 4, 5, 6])]));

    const result = await importMatchSchedule(schedule([]));

    expect(result).toMatchObject({ matchCount: 0, teamMatchCount: 0 });
    expect(await db.select().from(match)).toHaveLength(1);
    expect(await db.select().from(teamMatch)).toHaveLength(6);
  });
});
