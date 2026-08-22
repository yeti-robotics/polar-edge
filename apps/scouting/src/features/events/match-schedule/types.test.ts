import { describe, expect, it } from "vitest";
import { planScheduleChanges, type StoredSchedule } from "./types";

describe("planScheduleChanges", () => {
  it("plans stale matches, obsolete assignments, and changed match ids", () => {
    const stored: StoredSchedule = {
      matches: [
        { id: "kept", matchNumber: 1, matchType: "qm" },
        { id: "stale", matchNumber: 2, matchType: "qm" },
      ],
      teamMatches: [
        { id: 1, matchId: "kept", teamNumber: 101 },
        { id: 2, matchId: "kept", teamNumber: 102 },
        { id: 3, matchId: "stale", teamNumber: 103 },
      ],
    };

    const plan = planScheduleChanges(stored, [
      { matchNumber: 1, matchType: "qm", slots: [{ teamNumber: 101 }] },
    ]);

    expect(plan).toEqual({
      staleMatches: [stored.matches[1]],
      obsoleteTeamMatches: [stored.teamMatches[1], stored.teamMatches[2]],
      changedMatchIds: ["stale", "kept"],
    });
  });

  it("returns an empty plan when the stored assignments match the schedule", () => {
    const stored: StoredSchedule = {
      matches: [{ id: "match", matchNumber: 1, matchType: "qm" }],
      teamMatches: [{ id: 1, matchId: "match", teamNumber: 101 }],
    };

    expect(
      planScheduleChanges(stored, [
        { matchNumber: 1, matchType: "qm", slots: [{ teamNumber: 101 }] },
      ])
    ).toEqual({ staleMatches: [], obsoleteTeamMatches: [], changedMatchIds: [] });
  });
});
