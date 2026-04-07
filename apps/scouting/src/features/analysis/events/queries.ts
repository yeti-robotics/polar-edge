import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  event,
  member,
  pitForm,
  standForm,
  team,
  teamEventCopr,
  teamMatch,
  vStandFormExpected,
} from "@/lib/database/schema";
import type { TeamEventOverviewRow } from "./types";

const round1 = (value: number) => Math.round(value * 10) / 10;

export async function listAllEvents() {
  "use cache";
  cacheLife("hours");

  return db
    .select({
      id: event.id,
      eventCode: event.eventCode,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
    })
    .from(event)
    .orderBy(desc(event.startDate));
}

export async function getMainEventOverviewRow(
  eventId: string,
  opts?: { organizationId?: string | null }
): Promise<TeamEventOverviewRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.teamMetrics(eventId));

  const organizationId = opts?.organizationId ?? null;
  if (organizationId) {
    cacheTag(cacheTags.teamMetrics(`${eventId}-${organizationId}`));
  }

  // Per-team COPR fuel (single event, so just read directly from the table)
  const standPointsQuery = db
    .select({
      teamMatchId: standForm.teamMatchId,
      autoPoints: sql<number>`
        coalesce(${teamEventCopr.autoFuelCount}, 0)::numeric + coalesce(${vStandFormExpected.pureClimbAuto}, 0)
      `.as("auto_points"),
      teleopPoints: sql<number>`
        coalesce(${teamEventCopr.teleopFuelCount}, 0)::numeric + coalesce(${vStandFormExpected.pureClimbTeleop}, 0)
      `.as("teleop_points"),
      climbPoints: sql<number>`
        coalesce(${vStandFormExpected.pureClimbTotal}, 0)
      `.as("climb_points"),
      totalPoints: sql<number>`
        coalesce(${teamEventCopr.autoFuelCount}, 0)::numeric + coalesce(${teamEventCopr.teleopFuelCount}, 0)::numeric + coalesce(${vStandFormExpected.expTower}, 0)
      `.as("total_points"),
    })
    .from(standForm)
    .innerJoin(vStandFormExpected, eq(vStandFormExpected.standFormId, standForm.id))
    .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
    .leftJoin(
      teamEventCopr,
      and(
        eq(teamEventCopr.eventId, teamMatch.eventId),
        eq(teamEventCopr.teamNumber, teamMatch.teamNumber)
      )
    );

  const standPoints = db
    .$with("stand_points")
    .as(
      organizationId
        ? standPointsQuery
            .innerJoin(member, eq(member.id, standForm.scoutMemberId))
            .where(and(isNull(standForm.deletedAt), eq(member.organizationId, organizationId)))
        : standPointsQuery.where(isNull(standForm.deletedAt))
    );

  const teamMatchConsensusPoints = db.$with("team_match_consensus_points").as(
    db
      .select({
        teamMatchId: standPoints.teamMatchId,
        autoPoints: sql<number>`
          percentile_cont(0.5) within group (order by ${standPoints.autoPoints})
        `.as("auto_points"),
        teleopPoints: sql<number>`
          percentile_cont(0.5) within group (order by ${standPoints.teleopPoints})
        `.as("teleop_points"),
        climbPoints: sql<number>`
          percentile_cont(0.5) within group (order by ${standPoints.climbPoints})
        `.as("climb_points"),
        totalPoints: sql<number>`
          percentile_cont(0.5) within group (order by ${standPoints.totalPoints})
        `.as("total_points"),
      })
      .from(standPoints)
      .groupBy(standPoints.teamMatchId)
  );

  const teamMetrics = db.$with("team_metrics").as(
    db
      .select({
        teamNumber: teamMatch.teamNumber,
        avgAutoPoints: sql<number>`avg(${teamMatchConsensusPoints.autoPoints})`.as(
          "avg_auto_points"
        ),
        avgTeleopPoints: sql<number>`
          avg(${teamMatchConsensusPoints.teleopPoints})
        `.as("avg_teleop_points"),
        avgClimbPoints: sql<number>`
          avg(${teamMatchConsensusPoints.climbPoints})
        `.as("avg_climb_points"),
        avgTotalPoints: sql<number>`
          avg(${teamMatchConsensusPoints.totalPoints})
        `.as("avg_total_points"),
        matchesScouted: sql<number>`
          count(${teamMatchConsensusPoints.teamMatchId})::int
        `.as("matches_scouted"),
      })
      .from(teamMatch)
      .leftJoin(teamMatchConsensusPoints, eq(teamMatchConsensusPoints.teamMatchId, teamMatch.id))
      .where(eq(teamMatch.eventId, eventId))
      .groupBy(teamMatch.teamNumber)
  );

  const teamUptimeQuery = db
    .select({
      teamNumber: teamMatch.teamNumber,
      uptimePct: sql<number>`
        avg((150.0 - least(${standForm.oofTimeSeconds}, 150)) / 150.0 * 100)
      `.as("uptime_pct"),
    })
    .from(standForm)
    .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId));

  const teamUptime = db.$with("team_uptime").as(
    organizationId
      ? teamUptimeQuery
          .innerJoin(member, eq(member.id, standForm.scoutMemberId))
          .where(
            and(
              eq(teamMatch.eventId, eventId),
              isNull(standForm.deletedAt),
              eq(member.organizationId, organizationId)
            )
          )
          .groupBy(teamMatch.teamNumber)
      : teamUptimeQuery
          .where(and(eq(teamMatch.eventId, eventId), isNull(standForm.deletedAt)))
          .groupBy(teamMatch.teamNumber)
  );

  const latestPit = db.$with("latest_pit").as(
    db
      .select({
        teamNumber: pitForm.teamNumber,
        drivetrainType: sql<string | null>`
          (array_agg(${pitForm.drivetrainType} order by ${pitForm.createdAt} desc))[1]
        `.as("drivetrain_type"),
        climbType: sql<string | null>`
          (array_agg(${pitForm.climbType} order by ${pitForm.createdAt} desc))[1]
        `.as("climb_type"),
      })
      .from(pitForm)
      .groupBy(pitForm.teamNumber)
  );

  const baseTeams = db.$with("base_teams").as(
    db
      .selectDistinct({
        teamNumber: teamMatch.teamNumber,
        teamName: team.teamName,
      })
      .from(teamMatch)
      .innerJoin(team, eq(team.teamNumber, teamMatch.teamNumber))
      .where(eq(teamMatch.eventId, eventId))
  );

  const rawRows = await db
    .with(standPoints, teamMatchConsensusPoints, teamMetrics, teamUptime, latestPit, baseTeams)
    .select({
      teamNumber: baseTeams.teamNumber,
      teamName: baseTeams.teamName,
      avgAutoPoints: sql<number>`coalesce(${teamMetrics.avgAutoPoints}, 0)`.as("avg_auto_points"),
      avgTeleopPoints: sql<number>`
        coalesce(${teamMetrics.avgTeleopPoints}, 0)
      `.as("avg_teleop_points"),
      avgClimbPoints: sql<number>`
        coalesce(${teamMetrics.avgClimbPoints}, 0)
      `.as("avg_climb_points"),
      avgTotalPoints: sql<number>`
        coalesce(${teamMetrics.avgTotalPoints}, 0)
      `.as("avg_total_points"),
      uptimePct: sql<number>`coalesce(${teamUptime.uptimePct}, 0)`.as("uptime_pct"),
      matchesScouted: sql<number>`coalesce(${teamMetrics.matchesScouted}, 0)`.as("matches_scouted"),
      drivetrainType: latestPit.drivetrainType,
      climbType: latestPit.climbType,
    })
    .from(baseTeams)
    .leftJoin(teamMetrics, eq(teamMetrics.teamNumber, baseTeams.teamNumber))
    .leftJoin(teamUptime, eq(teamUptime.teamNumber, baseTeams.teamNumber))
    .leftJoin(latestPit, eq(latestPit.teamNumber, baseTeams.teamNumber))
    .orderBy(asc(baseTeams.teamNumber));

  const rows = rawRows.map((row) => ({
    teamNumber: row.teamNumber,
    teamName: row.teamName ?? null,
    avgAutoPoints: round1(Number(row.avgAutoPoints) || 0),
    avgTeleopPoints: round1(Number(row.avgTeleopPoints) || 0),
    avgClimbPoints: round1(Number(row.avgClimbPoints) || 0),
    avgTotalPoints: round1(Number(row.avgTotalPoints) || 0),
    uptimePct: round1(Number(row.uptimePct) || 0),
    matchesScouted: Number(row.matchesScouted) || 0,
    drivetrainType: row.drivetrainType ?? null,
    climbType: row.climbType ?? null,
  }));

  return rows;
}
