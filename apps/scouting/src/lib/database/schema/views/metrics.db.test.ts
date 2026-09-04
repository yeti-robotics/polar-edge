import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/database";
import {
  cycle,
  standForm,
  teamEventCopr,
  teamMatch,
  vStandFormExpected,
} from "@/lib/database/schema";
import { aMatch, anEvent, anOrganization } from "@/test/factories";

async function aScoutedCycle(bucket?: number) {
  const event = await anEvent();
  const { member } = await anOrganization({ activeEventId: event.id });
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
    .values({ teamMatchId: selectedTeamMatch.id, scoutMemberId: member.id })
    .returning();
  if (!form) throw new Error("Expected stand form");

  await db.insert(cycle).values({
    standFormId: form.id,
    phase: "teleop",
    cycleNumber: 1,
    bucket,
    dumpDuration: "2",
  });

  return { event, form };
}

async function expectedFuel(standFormId: string) {
  const [row] = await db
    .select({ expFuelActive: vStandFormExpected.expFuelActive })
    .from(vStandFormExpected)
    .where(eq(vStandFormExpected.standFormId, standFormId))
    .limit(1);
  return Number(row?.expFuelActive ?? 0);
}

describe("vStandFormExpected fuel fallback", () => {
  it("uses the manual bucket midpoint when COPR is unavailable", async () => {
    const { form } = await aScoutedCycle(2);

    expect(await expectedFuel(form.id)).toBe(4.5);
  });

  it("uses zero when neither COPR nor a manual estimate is available", async () => {
    const { form } = await aScoutedCycle();

    expect(await expectedFuel(form.id)).toBe(0);
  });

  it("automatically prefers COPR when it arrives after manual scouting", async () => {
    const { event, form } = await aScoutedCycle(2);
    expect(await expectedFuel(form.id)).toBe(4.5);

    await db.insert(teamEventCopr).values({
      eventId: event.id,
      teamNumber: 3506,
      autoFuelCount: "5",
      teleopFuelCount: "30",
      endgameFuelCount: "0",
      totalFuelCount: "35",
    });

    expect(await expectedFuel(form.id)).toBe(30);
  });
});
