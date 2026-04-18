import { describe, expect, it } from "vitest";
import {
  buildDefaultScheduleInfoSections,
  buildDefaultShiftSections,
  groupMatchesByShifts,
} from "./logic";
import { UpdateScoutingScheduleDetailsSchema } from "./types";

describe("scouting schedule logic", () => {
  it("keeps the last competition day instead of truncating the info table", () => {
    const sections = buildDefaultScheduleInfoSections(
      new Date("2026-04-10T10:00:00.000Z"),
      new Date("2026-04-12T21:00:00.000Z")
    );

    expect(sections).toHaveLength(3);
    expect(sections.map((section) => section.items)).toEqual([[], [], []]);
  });

  it("uses the real min and max match numbers instead of trusting input order", () => {
    const shifts = buildDefaultShiftSections([24, 3, 17, 8]);

    expect(shifts).toHaveLength(1);
    expect(shifts[0]).toMatchObject({
      startMatch: 3,
      endMatch: 24,
    });
  });

  it("keeps matches visible when they do not belong to any configured shift", () => {
    const groups = groupMatchesByShifts(
      [
        { matchNumber: 1, teams: [] },
        { matchNumber: 2, teams: [] },
        { matchNumber: 5, teams: [] },
      ],
      [
        {
          id: "shift-a",
          label: "Opening block",
          startMatch: 1,
          endMatch: 2,
          coordinatorMemberId: null,
        },
      ]
    );

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      id: "shift-a",
      matches: [{ matchNumber: 1, teams: [] }, { matchNumber: 2, teams: [] }],
    });
    expect(groups[1]).toMatchObject({
      id: "ungrouped",
      matches: [{ matchNumber: 5, teams: [] }],
    });
  });

  it("rejects overlapping shift ranges before they can scramble the board", () => {
    const parsed = UpdateScoutingScheduleDetailsSchema.safeParse({
      scheduleId: "2142652e-c1d4-4c23-8de6-2a397603c1da",
      name: "Weekend schedule",
      isOpen: true,
      infoSections: [],
      shiftSections: [
        {
          id: "shift-a",
          label: "Morning",
          startMatch: 1,
          endMatch: 8,
          coordinatorMemberId: null,
        },
        {
          id: "shift-b",
          label: "Midday",
          startMatch: 8,
          endMatch: 12,
          coordinatorMemberId: null,
        },
      ],
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("Shift ranges cannot overlap");
  });

  it("rejects reversed shift ranges instead of silently flipping them", () => {
    const parsed = UpdateScoutingScheduleDetailsSchema.safeParse({
      scheduleId: "2142652e-c1d4-4c23-8de6-2a397603c1da",
      name: "Weekend schedule",
      isOpen: true,
      infoSections: [],
      shiftSections: [
        {
          id: "shift-a",
          label: "Morning",
          startMatch: 9,
          endMatch: 4,
          coordinatorMemberId: null,
        },
      ],
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("Shift ranges must start before they end");
  });
});
