import type {
  ScoutingScheduleInfoSection,
  ScoutingScheduleShiftSection,
} from "@/lib/database/schema/tables/scouting-schedule";

export interface ScoutingScheduleBoardAssignment {
  slotIndex: 1 | 2;
  memberId: string | null;
}

export interface ScoutingScheduleBoardTeamSlot {
  teamMatchId: number;
  teamNumber: number;
  teamName: string;
  alliance: "red" | "blue";
  position: 1 | 2 | 3;
  assignments: ScoutingScheduleBoardAssignment[];
}

export interface ScoutingScheduleBoardMatch {
  matchNumber: number;
  teams: ScoutingScheduleBoardTeamSlot[];
}

export interface ScoutingScheduleBoardGroup {
  id: string;
  label: string;
  startMatch: number | null;
  endMatch: number | null;
  coordinatorMemberId: string | null;
  matches: ScoutingScheduleBoardMatch[];
}

function toUtcCalendarDate(input: Date | string) {
  const value = new Date(input);

  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function formatUtcDate(input: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    ...options,
  }).format(input);
}

export function formatScheduleDateRange(startDate: Date | string, endDate: Date | string) {
  const start = toUtcCalendarDate(startDate);
  const end = toUtcCalendarDate(endDate);

  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
  const sameDay = sameMonth && start.getUTCDate() === end.getUTCDate();

  if (sameDay) {
    return formatUtcDate(start, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (sameMonth) {
    return `${formatUtcDate(start, {
      month: "short",
      day: "numeric",
    })} - ${formatUtcDate(end, {
      day: "numeric",
      year: "numeric",
    })}`;
  }

  return `${formatUtcDate(start, {
    month: "short",
    day: "numeric",
  })} - ${formatUtcDate(end, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function createScheduleNodeId(prefix: string) {
  const randomSource =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}-${randomSource}`;
}

export function buildDefaultScheduleInfoSections(startDate: Date | string, endDate: Date | string) {
  const start = toUtcCalendarDate(startDate);
  const end = toUtcCalendarDate(endDate);
  const sections: ScoutingScheduleInfoSection[] = [];
  const cursor = new Date(start);
  const endDay = new Date(end);

  while (cursor <= endDay) {
    sections.push({
      id: createScheduleNodeId("info"),
      dateLabel: formatUtcDate(cursor, {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
      items: [],
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return sections;
}

export function buildDefaultShiftSections(matchNumbers: number[]) {
  if (matchNumbers.length === 0) {
    return [] satisfies ScoutingScheduleShiftSection[];
  }

  const sorted = [...matchNumbers].sort((a, b) => a - b);
  const shifts: ScoutingScheduleShiftSection[] = [];

  for (let index = 0; index < sorted.length; index += 5) {
    const startMatch = sorted[index];
    const endMatch = sorted[Math.min(index + 4, sorted.length - 1)];

    if (startMatch == null || endMatch == null) continue;

    shifts.push({
      id: createScheduleNodeId("shift"),
      label: `Matches ${startMatch}-${endMatch}`,
      startMatch,
      endMatch,
      coordinatorMemberId: null,
    });
  }

  return shifts;
}

export function groupMatchesByShifts(
  matches: ScoutingScheduleBoardMatch[],
  shifts: ScoutingScheduleShiftSection[]
) {
  const sortedMatches = [...matches].sort((a, b) => a.matchNumber - b.matchNumber);
  const sortedShifts = [...shifts].sort((a, b) => a.startMatch - b.startMatch);

  const groups: ScoutingScheduleBoardGroup[] = sortedShifts.map((shift) => ({
    id: shift.id,
    label: shift.label,
    startMatch: shift.startMatch,
    endMatch: shift.endMatch,
    coordinatorMemberId: shift.coordinatorMemberId,
    matches: [],
  }));

  const ungroupedMatches: ScoutingScheduleBoardMatch[] = [];

  for (const match of sortedMatches) {
    const group = groups.find(
      (shift) =>
        shift.startMatch !== null &&
        shift.endMatch !== null &&
        match.matchNumber >= shift.startMatch &&
        match.matchNumber <= shift.endMatch
    );

    if (group) {
      group.matches.push(match);
      continue;
    }

    ungroupedMatches.push(match);
  }

  if (ungroupedMatches.length > 0) {
    groups.push({
      id: "ungrouped",
      label: "Ungrouped matches",
      startMatch: null,
      endMatch: null,
      coordinatorMemberId: null,
      matches: ungroupedMatches,
    });
  }

  return groups.filter((group) => group.matches.length > 0);
}
