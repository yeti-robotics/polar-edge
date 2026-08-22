import { describe, expect, it } from "vitest";
import { tbaScheduleToImport } from "./tba";

describe("tbaScheduleToImport", () => {
  it("converts TBA data into the canonical match schedule", () => {
    const schedule = tbaScheduleToImport(
      [
        {
          comp_level: "qm",
          match_number: 1,
          alliances: {
            red: {
              score: 120,
              team_keys: ["frc3506", "frc1533", "frc900"],
              surrogate_team_keys: ["frc900"],
            },
            blue: {
              score: 105,
              team_keys: ["frc2642", "frc4290", "frc4795"],
              surrogate_team_keys: [],
            },
          },
        },
        {
          comp_level: "sf",
          match_number: 1,
          alliances: {
            red: {
              score: 150,
              team_keys: ["frc3506", "frc1533", "frc900"],
              surrogate_team_keys: [],
            },
            blue: {
              score: 140,
              team_keys: ["frc2642", "frc4290", "frc4795"],
              surrogate_team_keys: [],
            },
          },
        },
      ],
      [
        {
          team_number: 3506,
          nickname: "YETI Robotics",
          name: "YETI Robotics",
        },
        {
          team_number: 1533,
          nickname: "Triple Strange",
          name: "Triple Strange",
        },
        {
          team_number: 900,
          nickname: "The Zebracorns",
          name: "The Zebracorns",
        },
      ]
    );

    expect(schedule.matches).toHaveLength(1);

    expect(schedule.matches[0]).toEqual({
      matchNumber: 1,
      matchType: "qm",
      redScore: 120,
      blueScore: 105,
      slots: [
        {
          teamNumber: 3506,
          teamName: "YETI Robotics",
          alliance: "red",
          position: 1,
          surrogate: false,
        },
        {
          teamNumber: 2642,
          teamName: undefined,
          alliance: "blue",
          position: 1,
          surrogate: false,
        },
        {
          teamNumber: 1533,
          teamName: "Triple Strange",
          alliance: "red",
          position: 2,
          surrogate: false,
        },
        {
          teamNumber: 4290,
          teamName: undefined,
          alliance: "blue",
          position: 2,
          surrogate: false,
        },
        {
          teamNumber: 900,
          teamName: "The Zebracorns",
          alliance: "red",
          position: 3,
          surrogate: true,
        },
        {
          teamNumber: 4795,
          teamName: undefined,
          alliance: "blue",
          position: 3,
          surrogate: false,
        },
      ],
    });
  });

  it("treats negative TBA scores as unknown", () => {
    const schedule = tbaScheduleToImport(
      [
        {
          comp_level: "qm",
          match_number: 1,
          alliances: {
            red: {
              score: -1,
              team_keys: [],
              surrogate_team_keys: [],
            },
            blue: {
              score: -1,
              team_keys: [],
              surrogate_team_keys: [],
            },
          },
        },
      ],
      []
    );

    expect(schedule.matches[0]?.redScore).toBeUndefined();
    expect(schedule.matches[0]?.blueScore).toBeUndefined();
  });
});
