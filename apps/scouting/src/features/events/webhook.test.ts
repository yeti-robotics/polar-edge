import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findEvent: vi.fn(),
  getEventMatches: vi.fn(),
  transaction: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  where: vi.fn(),
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

  const insertChain = {
    values: vi.fn(),
    onConflictDoUpdate: vi.fn(),
    onConflictDoNothing: vi.fn(),
    returning: vi.fn().mockResolvedValue([{ id: "match-id", matchNumber: 1 }]),
  };
  insertChain.values.mockReturnValue(insertChain);
  insertChain.onConflictDoUpdate.mockReturnValue(insertChain);
  insertChain.onConflictDoNothing.mockResolvedValue(undefined);
  mocks.insert.mockReturnValue(insertChain);

  const selectChain = { from: vi.fn(), where: mocks.where };
  selectChain.from.mockReturnValue(selectChain);
  mocks.select.mockReturnValue(selectChain);
  mocks.where
    .mockResolvedValueOnce([{ id: "match-id", matchNumber: 1 }])
    .mockResolvedValueOnce([]);

  mocks.transaction.mockImplementation(async (callback) =>
    callback({ insert: mocks.insert, select: mocks.select })
  );
});

describe("processScheduleUpdated", () => {
  it("refuses to create a missing event", async () => {
    mocks.findEvent.mockResolvedValue(undefined);

    await expect(processScheduleUpdated(payload)).resolves.toEqual({
      updated: false,
      reason: "Event not in DB: 2026test",
    });
    expect(mocks.getEventMatches).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("imports the schedule for the resolved event", async () => {
    await expect(processScheduleUpdated(payload)).resolves.toEqual({ updated: true });

    expect(mocks.getEventMatches).toHaveBeenCalledWith("2026test");
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.insert).toHaveBeenCalledTimes(3);
  });

  it("does not import a schedule containing only playoff matches", async () => {
    mocks.getEventMatches.mockResolvedValue([{ ...tbaMatches[0], comp_level: "sf" }]);

    await expect(processScheduleUpdated(payload)).resolves.toEqual({
      updated: false,
      reason: "No qualifying matches in schedule",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
