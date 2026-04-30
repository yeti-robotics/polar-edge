import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  event,
  match,
  scoutingSchedule,
  scoutingScheduleAssignment,
  team,
  teamMatch,
} from "@/lib/database/schema";
import type {
  ScoutingScheduleInfoSection,
  ScoutingScheduleShiftSection,
} from "@/lib/database/schema/tables/scouting-schedule";
import { listOrganizationMembers } from "@/lib/server/organization/member";
import type { ScoutingScheduleBoardMatch } from "./logic";

export interface ScoutingScheduleListItem {
  id: string;
  name: string;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
  eventName: string;
  eventCode: string;
  startDate: Date;
  endDate: Date;
  matchCount: number;
}

export interface ScoutingScheduleMember {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

export interface ScoutingScheduleDetailData {
  schedule: {
    id: string;
    name: string;
    isOpen: boolean;
    infoSections: ScoutingScheduleInfoSection[];
    shiftSections: ScoutingScheduleShiftSection[];
    createdAt: Date;
    updatedAt: Date;
    event: {
      id: string;
      name: string;
      eventCode: string;
      startDate: Date;
      endDate: Date;
    };
  };
  members: ScoutingScheduleMember[];
  matches: ScoutingScheduleBoardMatch[];
}

export async function getScoutingSchedulesForOrganization(
  organizationId: string
): Promise<ScoutingScheduleListItem[]> {
  "use cache";

  cacheLife("hours");
  cacheTag(cacheTags.scoutingSchedules(organizationId));

  const rows = await db
    .select({
      id: scoutingSchedule.id,
      name: scoutingSchedule.name,
      isOpen: scoutingSchedule.isOpen,
      createdAt: scoutingSchedule.createdAt,
      updatedAt: scoutingSchedule.updatedAt,
      eventName: event.name,
      eventCode: event.eventCode,
      startDate: event.startDate,
      endDate: event.endDate,
      matchCount: sql<number>`count(distinct ${match.id})::int`,
    })
    .from(scoutingSchedule)
    .innerJoin(event, eq(event.id, scoutingSchedule.eventId))
    .leftJoin(match, and(eq(match.eventId, scoutingSchedule.eventId), eq(match.matchType, "qm")))
    .where(eq(scoutingSchedule.organizationId, organizationId))
    .groupBy(
      scoutingSchedule.id,
      scoutingSchedule.name,
      scoutingSchedule.isOpen,
      scoutingSchedule.createdAt,
      scoutingSchedule.updatedAt,
      event.name,
      event.eventCode,
      event.startDate,
      event.endDate
    )
    .orderBy(
      desc(scoutingSchedule.isOpen),
      desc(event.startDate),
      desc(scoutingSchedule.createdAt)
    );

  return rows.map((row) => ({
    ...row,
    matchCount: Number(row.matchCount) || 0,
  }));
}

export async function getScoutingScheduleDetail(
  scheduleId: string,
  organizationId: string
): Promise<ScoutingScheduleDetailData | null> {
  "use cache";

  cacheLife("hours");
  cacheTag(cacheTags.scoutingSchedule(organizationId, scheduleId));

  const scheduleRecord = await db.query.scoutingSchedule.findFirst({
    where: and(
      eq(scoutingSchedule.id, scheduleId),
      eq(scoutingSchedule.organizationId, organizationId)
    ),
    with: {
      event: true,
    },
  });

  if (!scheduleRecord?.event) {
    return null;
  }

  const [membersResponse, teamSlotRows, assignmentRows] = await Promise.all([
    listOrganizationMembers(organizationId),
    db
      .select({
        teamMatchId: teamMatch.id,
        matchNumber: match.matchNumber,
        teamNumber: teamMatch.teamNumber,
        teamName: team.teamName,
        alliance: teamMatch.alliance,
        position: teamMatch.position,
      })
      .from(teamMatch)
      .innerJoin(match, eq(match.id, teamMatch.matchId))
      .innerJoin(team, eq(team.teamNumber, teamMatch.teamNumber))
      .where(and(eq(teamMatch.eventId, scheduleRecord.eventId), eq(match.matchType, "qm"))),
    db
      .select({
        teamMatchId: scoutingScheduleAssignment.teamMatchId,
        slotIndex: scoutingScheduleAssignment.slotIndex,
        memberId: scoutingScheduleAssignment.memberId,
      })
      .from(scoutingScheduleAssignment)
      .where(eq(scoutingScheduleAssignment.scheduleId, scheduleId)),
  ]);

  const members = (membersResponse?.members ?? [])
    .map((memberRecord) => ({
      id: memberRecord.id,
      name: memberRecord.user.name,
      email: memberRecord.user.email,
      image: memberRecord.user.image ?? null,
      role: memberRecord.role,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const assignmentsByTeamMatch = new Map<number, Map<1 | 2, string | null>>();

  for (const row of assignmentRows) {
    const slotIndex = row.slotIndex as 1 | 2;
    const current = assignmentsByTeamMatch.get(row.teamMatchId) ?? new Map<1 | 2, string | null>();
    current.set(slotIndex, row.memberId);
    assignmentsByTeamMatch.set(row.teamMatchId, current);
  }

  const matchMap = new Map<number, ScoutingScheduleBoardMatch>();

  for (const row of teamSlotRows) {
    const matchEntry = matchMap.get(row.matchNumber) ?? {
      matchNumber: row.matchNumber,
      teams: [],
    };
    const assignedSeats = assignmentsByTeamMatch.get(row.teamMatchId);

    matchEntry.teams.push({
      teamMatchId: row.teamMatchId,
      teamNumber: row.teamNumber,
      teamName: row.teamName,
      alliance: row.alliance,
      position: row.position as 1 | 2 | 3,
      assignments: [
        {
          slotIndex: 1,
          memberId: assignedSeats?.get(1) ?? null,
        },
        {
          slotIndex: 2,
          memberId: assignedSeats?.get(2) ?? null,
        },
      ],
    });

    matchMap.set(row.matchNumber, matchEntry);
  }

  const matches = [...matchMap.values()]
    .sort((a, b) => a.matchNumber - b.matchNumber)
    .map((matchEntry) => ({
      ...matchEntry,
      teams: [...matchEntry.teams].sort((a, b) => {
        const allianceOrderA = a.alliance === "red" ? 0 : 1;
        const allianceOrderB = b.alliance === "red" ? 0 : 1;
        if (allianceOrderA !== allianceOrderB) {
          return allianceOrderA - allianceOrderB;
        }

        return a.position - b.position;
      }),
    }));

  return {
    schedule: {
      id: scheduleRecord.id,
      name: scheduleRecord.name,
      isOpen: scheduleRecord.isOpen,
      infoSections: scheduleRecord.infoSections,
      shiftSections: scheduleRecord.shiftSections,
      createdAt: scheduleRecord.createdAt,
      updatedAt: scheduleRecord.updatedAt,
      event: {
        id: scheduleRecord.event.id,
        name: scheduleRecord.event.name,
        eventCode: scheduleRecord.event.eventCode,
        startDate: scheduleRecord.event.startDate,
        endDate: scheduleRecord.event.endDate,
      },
    },
    members,
    matches,
  };
}
