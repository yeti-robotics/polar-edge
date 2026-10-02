import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { db } from "@/lib/database";
import { cycle, standForm, teamMatch } from "@/lib/database/schema";
import { aMatch, anEvent, anOrganization } from "@/test/factories";

vi.mock("server-only", () => ({}));

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
