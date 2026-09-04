import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/database";
import { cycle, organization, teamEventCopr, teamMatch } from "@/lib/database/schema";
import { aMatch, anEvent, anOrganization } from "@/test/factories";
import { lookupTeamMatch, submitStandForm } from "./logic";

async function aSelectedTeam(options: { fallbackEnabled: boolean; withCopr?: boolean }) {
  const event = await anEvent();
  const { organization: org, member } = await anOrganization({ activeEventId: event.id });
  await db
    .update(organization)
    .set({ metadata: JSON.stringify({ coprFallbackEnabled: options.fallbackEnabled }) })
    .where(eq(organization.id, org.id));

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

  if (options.withCopr) {
    await db.insert(teamEventCopr).values({
      eventId: event.id,
      teamNumber: 3506,
      autoFuelCount: "5",
      teleopFuelCount: "30",
      endgameFuelCount: "0",
      totalFuelCount: "35",
    });
  }

  return { event, org, member, selectedTeamMatch };
}

const aSubmission = (teamMatchId: number, bucket?: number) => ({
  teamMatchId,
  canShuttle: false,
  comments: "Observed a consistent shooting cycle during this match.",
  oofTimeSeconds: 0,
  cycles: [
    {
      phase: "teleop" as const,
      cycleNumber: 1,
      startedAt: 1_000,
      endedAt: 3_000,
      bucket,
    },
  ],
  climbs: [],
});

describe("stand-form manual COPR fallback", () => {
  it("requests a manual estimate only when enabled and COPR is absent", async () => {
    const { org } = await aSelectedTeam({ fallbackEnabled: true });

    await expect(lookupTeamMatch(1, 3506, org.id)).resolves.toMatchObject({
      requiresManualFuelEstimate: true,
    });
  });

  it("does not request a manual estimate when COPR exists", async () => {
    const { org } = await aSelectedTeam({ fallbackEnabled: true, withCopr: true });

    await expect(lookupTeamMatch(1, 3506, org.id)).resolves.toMatchObject({
      requiresManualFuelEstimate: false,
    });
  });

  it("does not request a manual estimate when the organization disables fallback", async () => {
    const { org } = await aSelectedTeam({ fallbackEnabled: false });

    await expect(lookupTeamMatch(1, 3506, org.id)).resolves.toMatchObject({
      requiresManualFuelEstimate: false,
    });
  });

  it("rejects a missing bucket when manual fallback is required", async () => {
    const { org, member, selectedTeamMatch } = await aSelectedTeam({ fallbackEnabled: true });

    await expect(
      submitStandForm(aSubmission(selectedTeamMatch.id), member.id, org.id)
    ).resolves.toEqual({ error: "A shooting-rate estimate is required for every shooting cycle" });
  });

  it("stores the selected bucket when manual fallback is required", async () => {
    const { org, member, selectedTeamMatch } = await aSelectedTeam({ fallbackEnabled: true });

    await expect(
      submitStandForm(aSubmission(selectedTeamMatch.id, 0), member.id, org.id)
    ).resolves.toMatchObject({ success: true });

    const storedCycle = await db.query.cycle.findFirst();
    expect(storedCycle?.bucket).toBe(0);
  });

  it("accepts a cycle without a bucket when COPR exists", async () => {
    const { org, member, selectedTeamMatch } = await aSelectedTeam({
      fallbackEnabled: true,
      withCopr: true,
    });

    await expect(
      submitStandForm(aSubmission(selectedTeamMatch.id), member.id, org.id)
    ).resolves.toMatchObject({ success: true });

    const storedCycle = await db.select().from(cycle).limit(1);
    expect(storedCycle[0]?.bucket).toBeNull();
  });
});
