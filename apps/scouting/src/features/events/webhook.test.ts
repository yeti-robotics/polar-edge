import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findEvent: vi.fn(),
  getEventMatches: vi.fn(),
  importMatchSchedule: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/database", () => ({
  db: {
    query: { event: { findFirst: mocks.findEvent } },
    transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/server/tba", () => ({
  getTBAClient: () => ({ matches: { getEventMatches: mocks.getEventMatches } }),
}));
vi.mock("./match-schedule/import", () => ({
  importMatchSchedule: mocks.importMatchSchedule,
}));

import { processScheduleUpdated } from "./webhook";

const payload = {
  message_type: "schedule_updated" as const,
  message_data: {
    event_key: "2026test",
    event_name: "Test Event",
  },
};

const tbaMatches = [
  {
    comp_level: "qm",
    match_number: 1,
    alliances: {
      red: { score: -1, team_keys: ["frc1", "frc2", "frc3"] },
      blue: { score: -1, team_keys: ["frc4", "frc5", "frc6"] },
    },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findEvent.mockResolvedValue({ id: "event-id" });
  mocks.getEventMatches.mockResolvedValue(tbaMatches);
  mocks.importMatchSchedule.mockResolvedValue({
    eventId: "event-id",
    matchCount: 1,
    teamMatchCount: 6,
  });
  mocks.transaction.mockResolvedValue(undefined);
});

describe("processScheduleUpdated", () => {
  it("refuses to create a missing event", async () => {
    mocks.findEvent.mockResolvedValue(undefined);

    await expect(processScheduleUpdated(payload)).resolves.toEqual({
      updated: false,
      reason: "Event not in DB: 2026test",
    });
    expect(mocks.getEventMatches).not.toHaveBeenCalled();
    expect(mocks.importMatchSchedule).not.toHaveBeenCalled();
  });

  it("imports the schedule for the resolved event", async () => {
    await expect(processScheduleUpdated(payload)).resolves.toEqual({ updated: true });

    expect(mocks.importMatchSchedule).toHaveBeenCalledWith(
      "event-id",
      expect.objectContaining({
        matches: [expect.objectContaining({ matchNumber: 1, matchType: "qm" })],
      })
    );
  });

  it("returns importer conflicts without running enrichment", async () => {
    mocks.importMatchSchedule.mockRejectedValue(
      new Error("Cannot replace the schedule because saved data exists for qm1.")
    );

    await expect(processScheduleUpdated(payload)).resolves.toEqual({
      updated: false,
      reason: "Cannot replace the schedule because saved data exists for qm1.",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
