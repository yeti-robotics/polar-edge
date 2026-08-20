import { parseTbaTeamKey } from "@/lib/tba";
import type { AllianceSlot, EventTarget, MatchSchedule } from "../types";

type TbaAllianceInput = {
  score?: number | null;
  team_keys: string[];
  surrogate_team_keys?: string[];
};

type TbaMatchInput = {
  comp_level: string;
  match_number: number;
  alliances: {
    red: TbaAllianceInput;
    blue: TbaAllianceInput;
  };
};

type TbaTeamInput = {
  team_number: number;
  nickname?: string | null;
  name?: string | null;
};

export function tbaScheduleToImport(
  event: EventTarget,
  tbaMatches: TbaMatchInput[],
  tbaTeams: TbaTeamInput[]
): MatchSchedule {
  const teamNameByNumber = new Map(
    tbaTeams.map((team) => [team.team_number, team.nickname ?? team.name ?? ""])
  );

  const qualifyingMatches = tbaMatches.filter((match) => match.comp_level === "qm");

  return {
    event,

    matches: qualifyingMatches.map((tbaMatch) => {
      const slots: AllianceSlot[] = [];

      const redSurrogates = new Set(tbaMatch.alliances.red.surrogate_team_keys ?? []);

      const blueSurrogates = new Set(tbaMatch.alliances.blue.surrogate_team_keys ?? []);

      for (let index = 0; index < 3; index++) {
        const redKey = tbaMatch.alliances.red.team_keys[index];
        const blueKey = tbaMatch.alliances.blue.team_keys[index];

        if (redKey) {
          const teamNumber = parseTbaTeamKey(redKey);

          slots.push({
            teamNumber,
            teamName: teamNameByNumber.get(teamNumber) || undefined,
            alliance: "red",
            position: (index + 1) as 1 | 2 | 3,
            surrogate: redSurrogates.has(redKey),
          });
        }

        if (blueKey) {
          const teamNumber = parseTbaTeamKey(blueKey);

          slots.push({
            teamNumber,
            teamName: teamNameByNumber.get(teamNumber) || undefined,
            alliance: "blue",
            position: (index + 1) as 1 | 2 | 3,
            surrogate: blueSurrogates.has(blueKey),
          });
        }
      }

      const redScore = tbaMatch.alliances.red.score;
      const blueScore = tbaMatch.alliances.blue.score;

      return {
        matchNumber: tbaMatch.match_number,
        matchType: "qm" as const,

        redScore: typeof redScore === "number" && redScore >= 0 ? redScore : undefined,

        blueScore: typeof blueScore === "number" && blueScore >= 0 ? blueScore : undefined,

        slots,
      };
    }),
  };
}
