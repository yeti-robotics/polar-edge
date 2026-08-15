import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/database";
import { driveTeamRanking, driveTeamRankingEntry } from "@/lib/database/schema";
import { aMatch, anEvent, anOrganization, aTeam } from "@/test/factories";

// Mock the framework (auth, request headers, cache), but let every query run
// against a real Postgres.
const { getActiveEventForOrganization } = vi.hoisted(() => ({
  getActiveEventForOrganization: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/server/organization/active-event", () => ({ getActiveEventForOrganization }));
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      getActiveMember: vi.fn(),
      hasPermission: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { lookupAllianceTeams, submitDriveRanking } from "./actions";

async function signedInWithActiveEvent() {
  const event = await anEvent();
  const { organization, member } = await anOrganization({ activeEventId: event.id });

  vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: member.userId } } as never);
  vi.mocked(auth.api.getActiveMember).mockResolvedValue({
    id: member.id,
    organizationId: organization.id,
  } as never);
  vi.mocked(auth.api.hasPermission).mockResolvedValue({ success: true } as never);
  getActiveEventForOrganization.mockResolvedValue({ event });

  return { event, organization, member };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("lookupAllianceTeams", () => {
  it("returns the alliance in position order with team names", async () => {
    const { event } = await signedInWithActiveEvent();
    await aTeam(3506, "YETI Robotics");
    await aMatch({ eventId: event.id, matchNumber: 1, red: [3506, 1234, 5678], blue: [1, 2, 3] });

    const result = await lookupAllianceTeams(1, "red");

    expect(result).toMatchObject({
      alreadyRanked: false,
      teams: [
        { teamNumber: 3506, teamName: "YETI Robotics" },
        { teamNumber: 1234, teamName: "" },
        { teamNumber: 5678, teamName: "" },
      ],
    });
  });

  it("does not return teams from a match in a different event", async () => {
    const { event } = await signedInWithActiveEvent();
    const other = await anEvent();
    await aMatch({ eventId: event.id, matchNumber: 1, red: [11, 12, 13], blue: [14, 15, 16] });
    await aMatch({ eventId: other.id, matchNumber: 2, red: [21, 22, 23], blue: [24, 25, 26] });

    expect(await lookupAllianceTeams(2, "red")).toEqual({
      error: "Match 2 not found in active event",
    });
  });

  it("reports an existing ranking for the same match, alliance and organization", async () => {
    const { event, organization, member } = await signedInWithActiveEvent();
    const created = await aMatch({
      eventId: event.id,
      matchNumber: 1,
      red: [11, 12, 13],
      blue: [14, 15, 16],
    });

    await db.insert(driveTeamRanking).values({
      matchId: created.id,
      alliance: "red",
      organizationId: organization.id,
      scoutMemberId: member.id,
    });

    expect(await lookupAllianceTeams(1, "red")).toMatchObject({ alreadyRanked: true });
    expect(await lookupAllianceTeams(1, "blue")).toMatchObject({ alreadyRanked: false });
  });
});

describe("submitDriveRanking", () => {
  it("persists entries in rank order", async () => {
    const { event, organization } = await signedInWithActiveEvent();
    await aMatch({ eventId: event.id, matchNumber: 1, red: [11, 12, 13], blue: [14, 15, 16] });

    expect(
      await submitDriveRanking({ matchNumber: 1, alliance: "red", rankings: [13, 11, 12] })
    ).toEqual({ success: true });

    const entries = await db
      .select({ teamNumber: driveTeamRankingEntry.teamNumber, rank: driveTeamRankingEntry.rank })
      .from(driveTeamRankingEntry)
      .innerJoin(driveTeamRanking, eq(driveTeamRanking.id, driveTeamRankingEntry.rankingId))
      .where(eq(driveTeamRanking.organizationId, organization.id))
      .orderBy(driveTeamRankingEntry.rank);

    expect(entries).toEqual([
      { teamNumber: 13, rank: 1 },
      { teamNumber: 11, rank: 2 },
      { teamNumber: 12, rank: 3 },
    ]);
  });

  it("replaces a previous ranking rather than accumulating entries", async () => {
    const { event, organization } = await signedInWithActiveEvent();
    await aMatch({ eventId: event.id, matchNumber: 1, red: [11, 12, 13], blue: [14, 15, 16] });

    await submitDriveRanking({ matchNumber: 1, alliance: "red", rankings: [11, 12, 13] });
    await submitDriveRanking({ matchNumber: 1, alliance: "red", rankings: [13, 12, 11] });

    const rankings = await db
      .select()
      .from(driveTeamRanking)
      .where(eq(driveTeamRanking.organizationId, organization.id));
    const entries = await db.select().from(driveTeamRankingEntry);

    expect(rankings).toHaveLength(1);
    expect(entries).toHaveLength(3);
    expect(entries.find((e) => e.rank === 1)?.teamNumber).toBe(13);
  });

  it("rejects a team that is not on that alliance", async () => {
    const { event } = await signedInWithActiveEvent();
    await aMatch({ eventId: event.id, matchNumber: 1, red: [11, 12, 13], blue: [14, 15, 16] });

    expect(
      await submitDriveRanking({ matchNumber: 1, alliance: "red", rankings: [11, 12, 14] })
    ).toEqual({ error: "Team 14 is not on red alliance in match 1" });

    expect(await db.select().from(driveTeamRanking)).toHaveLength(0);
  });
});
