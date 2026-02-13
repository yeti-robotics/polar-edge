import "server-only";

import { and, count, eq, notInArray } from "drizzle-orm";
import { db } from "@/lib/database";
import { picklist, picklistTeam, team, teamMatch } from "@/lib/database/schema";

/**
 * Get all picklists for a specific organization and event
 * Returns picklists with team count
 */
export async function getPicklistsForEvent(organizationId: string, eventId: string) {
  const picklists = await db
    .select({
      id: picklist.id,
      name: picklist.name,
      createdAt: picklist.createdAt,
      updatedAt: picklist.updatedAt,
      teamCount: count(picklistTeam.id),
    })
    .from(picklist)
    .leftJoin(picklistTeam, eq(picklist.id, picklistTeam.picklistId))
    .where(and(eq(picklist.organizationId, organizationId), eq(picklist.eventId, eventId)))
    .groupBy(picklist.id)
    .orderBy(picklist.createdAt);

  return picklists;
}

/**
 * Get a single picklist with all its teams, ordered by rank
 * Verifies the picklist belongs to the specified organization
 */
export async function getPicklistWithTeams(picklistId: string, organizationId: string) {
  // First verify the picklist belongs to this organization
  const picklistRecord = await db.query.picklist.findFirst({
    where: and(eq(picklist.id, picklistId), eq(picklist.organizationId, organizationId)),
  });

  if (!picklistRecord) {
    return null;
  }

  // Get all teams in the picklist with team details
  const teams = await db
    .select({
      teamNumber: picklistTeam.teamNumber,
      rank: picklistTeam.rank,
      teamName: team.teamName,
      picked: picklistTeam.picked,
    })
    .from(picklistTeam)
    .innerJoin(team, eq(picklistTeam.teamNumber, team.teamNumber))
    .where(eq(picklistTeam.picklistId, picklistId))
    .orderBy(picklistTeam.rank);

  return {
    picklist: picklistRecord,
    teams,
  };
}

/**
 * Get all teams at a specific event
 */
export async function getTeamsForEvent(eventId: string) {
  const teams = await db
    .selectDistinct({
      teamNumber: teamMatch.teamNumber,
      teamName: team.teamName,
    })
    .from(teamMatch)
    .innerJoin(team, eq(teamMatch.teamNumber, team.teamNumber))
    .where(eq(teamMatch.eventId, eventId))
    .orderBy(teamMatch.teamNumber);

  return teams;
}

/**
 * Get teams at an event that are not already in a picklist
 */
export async function getAvailableTeamsForPicklist(eventId: string, picklistId: string) {
  // Get team numbers already in the picklist
  const picklistTeams = await db
    .select({ teamNumber: picklistTeam.teamNumber })
    .from(picklistTeam)
    .where(eq(picklistTeam.picklistId, picklistId));

  const picklistTeamNumbers = picklistTeams.map((t) => t.teamNumber);

  // Get all teams at the event
  const allTeams = await db
    .selectDistinct({
      teamNumber: teamMatch.teamNumber,
      teamName: team.teamName,
    })
    .from(teamMatch)
    .innerJoin(team, eq(teamMatch.teamNumber, team.teamNumber))
    .where(
      picklistTeamNumbers.length > 0
        ? and(eq(teamMatch.eventId, eventId), notInArray(teamMatch.teamNumber, picklistTeamNumbers))
        : eq(teamMatch.eventId, eventId)
    )
    .orderBy(teamMatch.teamNumber);

  return allTeams;
}
