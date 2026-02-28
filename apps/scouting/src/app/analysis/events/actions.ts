import "server-only";

import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  cycle,
  pitForm,
  standForm,
  team,
  teamMatch,
  vStandFormExpected,
} from "@/lib/database/schema";

export interface MainEventOverviewRow {
  teamNumber: number;
  teamName: string | null;
  avgAutoPoints: number;
  avgTeleopPoints: number;
  avgClimbPoints: number;
  avgTotalPoints: number;
  uptimePct: number;
  matchesScouted: number;
  drivetrainType: string | null;
  climbType: string | null;
  overallScore: number;
  overallRank: number;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export async function getMainEventOverviewRow(eventId: string): Promise<MainEventOverviewRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.teamMetrics(eventId));

  const fuelPointsExpr = sql`
  //took these cases from schema prior
    (case ${cycle.bucket}
      when 0 then 0.0
      when 1 then 1.0
      when 2 then 2.25
      when 3 then 4.0
      when 4 then 6.0
      when 5 then 8.0
      else 0.0
    end) * greatest(coalesce(${cycle.dumpDuration}, 0), 0)
  `;
  //started the query writing here (finally wrote them queries :)
  const standCyclePoints = db.$with("stand_cycle_points").as(
    db
      .select({
        standFormId: cycle.standFormId,
        autoFuelPoints: sql<number>`
          sum(case when ${cycle.phase} = 'auto' then ${fuelPointsExpr} else 0 end)
        `.as("auto_fuel_points"),
        teleopFuelPoints: sql<number>`
          sum(case when ${cycle.phase} = 'teleop' then ${fuelPointsExpr} else 0 end)
        `.as("teleop_fuel_points"),
      })
      .from(cycle)
      .groupBy(cycle.standFormId)
  );

  const standPoints = db.$with("stand_points").as(
    db
      .select({
        teamMatchId: standForm.teamMatchId,
        autoPoints: sql<number>`
          coalesce(${standCyclePoints.autoFuelPoints}, 0) + coalesce(${vStandFormExpected.pureClimbAuto}, 0)
        `.as("auto_points"),
        teleopPoints: sql<number>`
          coalesce(${standCyclePoints.teleopFuelPoints}, 0) + coalesce(${vStandFormExpected.pureClimbTeleop}, 0)
        `.as("teleop_points"),
        climbPoints: sql<number>`
          coalesce(${vStandFormExpected.pureClimbTotal}, 0)
        `.as("climb_points"),
        totalPoints: sql<number>`
          coalesce(${vStandFormExpected.expFuelActive}, 0) + coalesce(${vStandFormExpected.expTower}, 0)
        `.as("total_points"),
      })
      .from(standForm)
      .innerJoin(vStandFormExpected, eq(vStandFormExpected.standFormId, standForm.id))
      .leftJoin(standCyclePoints, eq(standCyclePoints.standFormId, standForm.id))
      .where(isNull(standForm.deletedAt))
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

  const teamUptime = db.$with("team_uptime").as(
    db
      .select({
        teamNumber: teamMatch.teamNumber,
        uptimePct: sql<number>`
          avg((150.0 - least(${standForm.oofTimeSeconds}, 150)) / 150.0 * 100)
        `.as("uptime_pct"),
      })
      .from(standForm)
      .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
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
    .with(
      standCyclePoints,
      standPoints,
      teamMatchConsensusPoints,
      teamMetrics,
      teamUptime,
      latestPit,
      baseTeams
    )
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

  if (rows.length === 0) return [];

  const maximumPossibleAuto = Math.max(...rows.map((r) => r.avgAutoPoints), 0.001);
  const maximumPossibleTeleop = Math.max(...rows.map((r) => r.avgTeleopPoints), 0.001);
  const maximumPossibleClimb = Math.max(...rows.map((r) => r.avgClimbPoints), 0.001);
  const maximumPossibleMatches = Math.max(...rows.map((r) => r.matchesScouted), 1);

  const withScore = rows.map((row) => {
    const autoNormal = row.avgAutoPoints / maximumPossibleAuto;
    const teleopNormal = row.avgTeleopPoints / maximumPossibleTeleop;
    const climbNormal = row.avgClimbPoints / maximumPossibleClimb;
    const uptimeNormal = row.uptimePct / 100;
    const sampleNormal = row.matchesScouted / maximumPossibleMatches;

    const overallScore =
      (autoNormal * 0.22 +
        teleopNormal * 0.33 +
        climbNormal * 0.2 +
        uptimeNormal * 0.2 +
        sampleNormal * 0.05) *
      100;

    return {
      ...row,
      overallScore: round1(overallScore),
    };
  });

  const ranked = [...withScore].sort((a, b) => b.overallScore - a.overallScore);
  const rankByTeam = new Map(ranked.map((row, index) => [row.teamNumber, index + 1]));

  return withScore.map((row) => ({
    ...row,
    overallRank: rankByTeam.get(row.teamNumber) ?? withScore.length,
  }));
}
