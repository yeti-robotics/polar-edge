import "server-only";

import { eq } from "drizzle-orm";
import { getTeamMetricsForEvent } from "@/features/picklist/queries";
import { getDriveTeamRatings } from "@/features/scouting/drive-ranking/queries";
import { db } from "@/lib/database";
import { team, teamMatch } from "@/lib/database/schema";
import type { SimTeam } from "./types";

/**
 * Get all teams available for alliance simulation at the active event.
 * Merges team info, picklist metrics, and drive ratings into SimTeam objects.
 */
export async function getSimTeamsForEvent(
  organizationId: string,
  eventId: string
): Promise<SimTeam[]> {
  const [eventTeams, metricsMap, driveRatings] = await Promise.all([
    db
      .selectDistinct({
        teamNumber: teamMatch.teamNumber,
        teamName: team.teamName,
      })
      .from(teamMatch)
      .innerJoin(team, eq(teamMatch.teamNumber, team.teamNumber))
      .where(eq(teamMatch.eventId, eventId))
      .orderBy(teamMatch.teamNumber),
    getTeamMetricsForEvent(eventId),
    getDriveTeamRatings(organizationId, eventId),
  ]);

  const ratingsByTeam = new Map(driveRatings.map((r) => [r.teamNumber, r]));

  return eventTeams.map((t) => {
    const metrics = metricsMap.get(t.teamNumber);
    const rating = ratingsByTeam.get(t.teamNumber);

    return {
      teamNumber: t.teamNumber,
      teamName: t.teamName,
      mu: rating?.mu ?? 25,
      sigma: rating?.sigma ?? 8.333,
      ordinal: rating?.ordinal ?? 0,
      avgTotalPoints: metrics?.avgTotalPoints ?? 0,
      climbSuccessPct: metrics?.climbSuccessPct ?? 0,
      uptimePct: metrics?.uptimePct ?? 0,
      matchesScouted: metrics?.matchesScouted ?? 0,
    };
  });
}
