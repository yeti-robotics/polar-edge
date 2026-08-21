import { matchTypeEnum } from "@/lib/database/schema/types";

export type MatchType = (typeof matchTypeEnum.enumValues)[number];

export type StoredMatch = { id: string; matchNumber: number; matchType: MatchType };
export type StoredTeamMatch = { id: number; matchId: string; teamNumber: number };
export type StoredSchedule = {
  matches: StoredMatch[];
  teamMatches: StoredTeamMatch[];
};

export type IncomingMatch = {
  matchNumber: number;
  matchType: MatchType;
  slots: { teamNumber: number }[];
};

export type ScheduleChanges = {
  staleMatches: StoredMatch[];
  obsoleteTeamMatches: StoredTeamMatch[];
  changedMatchIds: string[];
};

export function planScheduleChanges(
  stored: StoredSchedule,
  schedule: IncomingMatch[]
): ScheduleChanges {
  const incomingKeys = new Set(
    schedule.map(({ matchNumber, matchType }) => matchKey(matchNumber, matchType))
  );
  const staleMatches = stored.matches.filter(
    ({ matchNumber, matchType }) => !incomingKeys.has(matchKey(matchNumber, matchType))
  );
  const staleMatchIds = new Set(staleMatches.map(({ id }) => id));
  const storedKeyById = new Map(
    stored.matches.map(({ id, matchNumber, matchType }) => [id, matchKey(matchNumber, matchType)])
  );
  const wantedTeamsByMatch = new Map(
    schedule.map(({ matchNumber, matchType, slots }) => [
      matchKey(matchNumber, matchType),
      new Set(slots.map(({ teamNumber }) => teamNumber)),
    ])
  );
  const obsoleteTeamMatches = stored.teamMatches.filter(({ matchId, teamNumber }) => {
    if (staleMatchIds.has(matchId)) return true;
    const key = storedKeyById.get(matchId);
    return !key || !wantedTeamsByMatch.get(key)?.has(teamNumber);
  });
  const changedMatchIds = [
    ...new Set([...staleMatchIds, ...obsoleteTeamMatches.map(({ matchId }) => matchId)]),
  ];

  return { staleMatches, obsoleteTeamMatches, changedMatchIds };
}

function matchKey(matchNumber: number, matchType: MatchType): string {
  return `${matchNumber}:${matchType}`;
}

export type AllianceColor = "red" | "blue";
export type AlliancePosition = 1 | 2 | 3;

export type AllianceSlot = {
  teamNumber: number;
  alliance: AllianceColor;
  position: AlliancePosition;

  // making optional since csv may not know these

  teamName?: string;
  surrogate?: boolean;
};

export type ScheduledMatch = {
  matchNumber: number;
  matchType: MatchType;
  redScore?: number;
  blueScore?: number;
  slots: AllianceSlot[];
};

export type MatchSchedule = {
  matches: ScheduledMatch[];
};

export type ImportResult = {
  eventId: string;
  matchCount: number;
  teamMatchCount: number;
};
