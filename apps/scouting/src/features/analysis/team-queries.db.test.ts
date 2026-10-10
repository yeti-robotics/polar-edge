import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { db } from "@/lib/database";
import { cycle, standForm, teamEventCopr, teamMatch } from "@/lib/database/schema";
import { aMatch, anEvent, anOrganization } from "@/test/factories";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { getMainEventOverviewRow } from "./events/queries";
import { getTeamBpsEstimate, getTeamKeyMetrics } from "./team-queries";

describe("organization-scoped manual fuel analysis", () => {
  it("does not mix fallback estimates from different organizations", async () => {
    const event = await anEvent();
    const first = await anOrganization({ activeEventId: event.id });
    const second = await anOrganization({ activeEventId: event.id });

    await aMatch({
      eventId: event.id,
      matchNumber: 1,
      red: [3506, 1234, 5678],
      blue: [1, 2, 3],
    });

    const selectedTeamMatch = await db.query.teamMatch.findFirst({
      where: eq(teamMatch.teamNumber, 3506),
    });
    if (!selectedTeamMatch) throw new Error("Expected team match");

    const forms = await db
      .insert(standForm)
      .values([
        {
          teamMatchId: selectedTeamMatch.id,
          scoutMemberId: first.member.id,
          usesManualFuelEstimate: true,
        },
        {
          teamMatchId: selectedTeamMatch.id,
          scoutMemberId: second.member.id,
          usesManualFuelEstimate: true,
        },
      ])
      .returning();

    const [firstForm, secondForm] = forms;
    if (!firstForm || !secondForm) throw new Error("Expected stand forms");

    await db.insert(cycle).values([
      {
        standFormId: firstForm.id,
        phase: "teleop",
        cycleNumber: 1,
        bucket: 1,
        dumpDuration: "2",
      },
      {
        standFormId: secondForm.id,
        phase: "teleop",
        cycleNumber: 1,
        bucket: 5,
        dumpDuration: "2",
      },
    ]);

    const [firstMetrics, secondMetrics, firstBps, secondBps] = await Promise.all([
      getTeamKeyMetrics(3506, { organizationId: first.organization.id, eventId: event.id }),
      getTeamKeyMetrics(3506, { organizationId: second.organization.id, eventId: event.id }),
      getTeamBpsEstimate(3506, { organizationId: first.organization.id, eventId: event.id }),
      getTeamBpsEstimate(3506, { organizationId: second.organization.id, eventId: event.id }),
    ]);

    expect(firstMetrics).toMatchObject({ avgTeleopPoints: 2, teleopFuelIsEstimated: true });
    expect(secondMetrics).toMatchObject({ avgTeleopPoints: 16, teleopFuelIsEstimated: true });
    expect(firstBps).toMatchObject({ bps: 1, totalFuelPerMatch: 2, isEstimated: true });
    expect(secondBps).toMatchObject({ bps: 8, totalFuelPerMatch: 16, isEstimated: true });
  });
});

describe("COPR metrics with missing phase observations", () => {
  it.each([
    "auto",
    "teleop",
    "none",
  ] as const)("preserves team and event fuel totals with %s cycles", async (phase) => {
    const event = await anEvent();
    const org = await anOrganization({ activeEventId: event.id });
    await aMatch({
      eventId: event.id,
      matchNumber: 1,
      red: [3506, 1234, 5678],
      blue: [1, 2, 3],
    });
    const selectedTeamMatch = await db.query.teamMatch.findFirst({
      where: eq(teamMatch.teamNumber, 3506),
    });
    if (!selectedTeamMatch) throw new Error("Expected team match");
    const [form] = await db
      .insert(standForm)
      .values({ teamMatchId: selectedTeamMatch.id, scoutMemberId: org.member.id })
      .returning();
    if (!form) throw new Error("Expected stand form");
    if (phase !== "none") {
      await db.insert(cycle).values({
        standFormId: form.id,
        phase,
        cycleNumber: 1,
        dumpDuration: "2",
      });
    }
    await db.insert(teamEventCopr).values({
      eventId: event.id,
      teamNumber: 3506,
      autoFuelCount: "5",
      teleopFuelCount: "30",
      endgameFuelCount: "0",
      totalFuelCount: "35",
    });
    const scope = { eventId: event.id, organizationId: org.organization.id };
    const [metrics, rows, bps] = await Promise.all([
      getTeamKeyMetrics(3506, scope),
      getMainEventOverviewRow(event.id, scope),
      getTeamBpsEstimate(3506, scope),
    ]);
    expect(metrics).toMatchObject({
      avgAutoPoints: 5,
      avgTeleopPoints: 30,
      autoFuelIsEstimated: false,
      teleopFuelIsEstimated: false,
    });
    expect(rows.find((row) => row.teamNumber === 3506)).toMatchObject({
      avgAutoPoints: 5,
      avgTeleopPoints: 30,
      avgTotalPoints: 35,
      autoFuelIsEstimated: false,
      teleopFuelIsEstimated: false,
      totalFuelIsEstimated: false,
    });
    if (phase === "none") expect(bps).toBeNull();
    else expect(bps).toMatchObject({ totalFuelPerMatch: 35, isEstimated: false });
  });
});

describe("BPS fuel source availability", () => {
  async function aShootingMatch(
    eventId: string,
    scoutMemberId: string,
    matchNumber: number,
    bucket?: number
  ) {
    const match = await aMatch({
      eventId,
      matchNumber,
      red: [3506, 1234, 5678],
      blue: [1, 2, 3],
    });
    const slots = await db.select().from(teamMatch).where(eq(teamMatch.matchId, match.id));
    const selectedTeamMatch = slots.find((slot) => slot.teamNumber === 3506);
    if (!selectedTeamMatch) throw new Error("Expected team match");
    const [form] = await db
      .insert(standForm)
      .values({
        teamMatchId: selectedTeamMatch.id,
        scoutMemberId,
        usesManualFuelEstimate: bucket !== undefined,
      })
      .returning();
    if (!form) throw new Error("Expected stand form");
    await db.insert(cycle).values({
      standFormId: form.id,
      phase: "teleop",
      cycleNumber: 1,
      bucket,
      dumpDuration: "2",
    });
  }

  it("returns unavailable when neither COPR nor captured manual rates exist", async () => {
    const event = await anEvent();
    const org = await anOrganization({ activeEventId: event.id });
    await aShootingMatch(event.id, org.member.id, 1);
    expect(await getTeamBpsEstimate(3506, { eventId: event.id })).toBeNull();
  });

  it("excludes unknown matches from both fuel and shooting time averages", async () => {
    const event = await anEvent();
    const org = await anOrganization({ activeEventId: event.id });
    await aShootingMatch(event.id, org.member.id, 1, 3);
    await aShootingMatch(event.id, org.member.id, 2);
    expect(await getTeamBpsEstimate(3506, { eventId: event.id })).toEqual({
      bps: 4,
      isEstimated: true,
      totalFuelPerMatch: 8,
      avgShootingTimePerMatch: 2,
    });
  });

  it("retains an explicitly observed zero manual rate", async () => {
    const event = await anEvent();
    const org = await anOrganization({ activeEventId: event.id });
    await aShootingMatch(event.id, org.member.id, 1, 0);
    expect(await getTeamBpsEstimate(3506, { eventId: event.id })).toMatchObject({
      bps: 0,
      totalFuelPerMatch: 0,
      isEstimated: true,
    });
  });

  it("retains zero COPR fuel as a valid measurement", async () => {
    const event = await anEvent();
    const org = await anOrganization({ activeEventId: event.id });
    await aShootingMatch(event.id, org.member.id, 1);
    await db.insert(teamEventCopr).values({
      eventId: event.id,
      teamNumber: 3506,
      autoFuelCount: "0",
      teleopFuelCount: "0",
      endgameFuelCount: "0",
      totalFuelCount: "0",
    });
    expect(await getTeamBpsEstimate(3506, { eventId: event.id })).toMatchObject({
      bps: 0,
      totalFuelPerMatch: 0,
      isEstimated: false,
    });
  });
});
