import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/lib/database";

export interface AnalysisTeamRow {
  teamNumber: number;
  teamName: string;
  avgAutoPoints: number;
  avgTeleopPoints: number;
  avgClimbPoints: number;
  avgTotalPoints: number;
  uptimePct: number;
  matchesScouted: number;
  scheduledMatches: number;
  consistencyScore: number;
  overallScore: number;
  overallRank: number;
  drivetrain: string;
  climbType: string;
  canTrench: boolean;
  canBump: boolean;
  canShuttle: boolean;
  capacity: number;
  weight: number;
}

export interface AnalysisSummary {
  totalTeams: number;
  teamsScouted: number;
  totalMatchesScouted: number;
  avgPointsPerMatch: number;
  highestScoringTeam: {
    teamNumber: number;
    teamName: string;
    avgTotalPoints: number;
  } | null;
}

export interface AnalysisOverviewData {
  teams: AnalysisTeamRow[];
  summary: AnalysisSummary;
}

interface TeamOverviewRowRaw {
  [key: string]: unknown;
  team_number: number | string;
  team_name: string;
  avg_auto_points: number | string;
  avg_teleop_points: number | string;
  avg_climb_points: number | string;
  avg_total_points: number | string;
  uptime_pct: number | string;
  matches_scouted: number | string;
  scheduled_matches: number | string;
  consistency_score: number | string;
  overall_score: number | string;
  overall_rank: number | string;
  drivetrain: string;
  climb_type: string;
  can_trench: boolean;
  can_bump: boolean;
  can_shuttle: boolean;
  capacity: number | string;
  weight: number | string;
}

export async function getAnalysisOverviewData(eventId: string): Promise<AnalysisOverviewData> {
  const result = await db.execute<TeamOverviewRowRaw>(sql`
    with event_teams as (
      select distinct tm.team_number
      from team_match tm
      where tm.event_id = ${eventId}
    ),
    team_match_counts as (
      select tm.team_number, count(*)::int as scheduled_matches
      from team_match tm
      where tm.event_id = ${eventId}
      group by tm.team_number
    ),
    pit_latest as (
      select distinct on (pf.team_number)
        pf.team_number,
        pf.drivetrain,
        pf.climb_type,
        pf.can_trench,
        pf.can_bump,
        pf.can_shuttle,
        pf.capacity,
        pf.weight
      from pit_form pf
      order by pf.team_number, pf.updated_at desc, pf.created_at desc
    ),
    cycle_points as (
      select
        sf.id as stand_form_id,
        sum(
          case
            when c.phase = 'auto' then
              (case c.bucket
                when 0 then 0.0
                when 1 then 1.0
                when 2 then 2.25
                when 3 then 4.0
                when 4 then 6.0
                when 5 then 8.0
                else 0.0
              end) * greatest(coalesce(c.dump_duration, 0.0), 0.0)
            else 0.0
          end
        ) as auto_points,
        sum(
          case
            when c.phase = 'teleop' then
              (case c.bucket
                when 0 then 0.0
                when 1 then 1.0
                when 2 then 2.25
                when 3 then 4.0
                when 4 then 6.0
                when 5 then 8.0
                else 0.0
              end) * greatest(coalesce(c.dump_duration, 0.0), 0.0)
            else 0.0
          end
        ) as teleop_points
      from stand_form sf
      left join cycle c on c.stand_form_id = sf.id
      where sf.deleted_at is null
      group by sf.id
    ),
    climb_points as (
      select
        sf.id as stand_form_id,
        sum(
          (case
            when cl.climb_success = false then 0.0
            when cl.climb_level = 0 then 0.0
            when cl.climb_level = 1 and cl.climb_phase = 'auto' then 15.0
            when cl.climb_level = 1 then 10.0
            when cl.climb_level = 2 then 20.0
            when cl.climb_level = 3 then 30.0
            else 0.0
          end)
          +
          (case
            when cl.climb_success = false then 0.0
            when cl.climb_duration <= 3.0 then 2.0
            when cl.climb_duration <= 6.0 then 0.0
            when cl.climb_duration > 6.0 then -2.0
            else 0.0
          end)
        ) as climb_points
      from stand_form sf
      left join climb cl on cl.stand_form_id = sf.id
      where sf.deleted_at is null
      group by sf.id
    ),
    stand_metrics as (
      select
        sf.team_match_id,
        coalesce(cp.auto_points, 0.0) as auto_points,
        coalesce(cp.teleop_points, 0.0) as teleop_points,
        coalesce(clp.climb_points, 0.0) as climb_points,
        least(sf.oof_time_seconds, 150)::float as oof_time_seconds
      from stand_form sf
      left join cycle_points cp on cp.stand_form_id = sf.id
      left join climb_points clp on clp.stand_form_id = sf.id
      where sf.deleted_at is null
    ),
    team_match_metrics as (
      select
        sm.team_match_id,
        avg(sm.auto_points) as auto_points,
        avg(sm.teleop_points) as teleop_points,
        avg(sm.climb_points) as climb_points,
        avg(sm.oof_time_seconds) as oof_time_seconds
      from stand_metrics sm
      group by sm.team_match_id
    ),
    team_event_metrics as (
      select
        tm.team_number,
        avg(coalesce(tmm.auto_points, 0.0)) as avg_auto_points,
        avg(coalesce(tmm.teleop_points, 0.0)) as avg_teleop_points,
        avg(coalesce(tmm.climb_points, 0.0)) as avg_climb_points,
        avg(coalesce(tmm.auto_points, 0.0) + coalesce(tmm.teleop_points, 0.0) + coalesce(tmm.climb_points, 0.0)) as avg_total_points,
        avg((150.0 - coalesce(tmm.oof_time_seconds, 150.0)) / 150.0 * 100.0) as uptime_pct,
        count(tmm.team_match_id)::int as matches_scouted,
        stddev_pop(coalesce(tmm.auto_points, 0.0) + coalesce(tmm.teleop_points, 0.0) + coalesce(tmm.climb_points, 0.0)) as total_stddev
      from team_match tm
      left join team_match_metrics tmm on tmm.team_match_id = tm.id
      where tm.event_id = ${eventId}
      group by tm.team_number
    ),
    scored as (
      select
        et.team_number,
        t.team_name,
        coalesce(tem.avg_auto_points, 0.0) as avg_auto_points,
        coalesce(tem.avg_teleop_points, 0.0) as avg_teleop_points,
        coalesce(tem.avg_climb_points, 0.0) as avg_climb_points,
        coalesce(tem.avg_total_points, 0.0) as avg_total_points,
        coalesce(tem.uptime_pct, 0.0) as uptime_pct,
        coalesce(tem.matches_scouted, 0) as matches_scouted,
        coalesce(tmc.scheduled_matches, 0) as scheduled_matches,
        case
          when coalesce(tem.matches_scouted, 0) = 0 then 0.0
          else greatest(0.0, 100.0 - coalesce(tem.total_stddev, 0.0) * 10.0)
        end as consistency_score,
        coalesce(pl.drivetrain::text, 'unknown') as drivetrain,
        coalesce(pl.climb_type::text, 'unknown') as climb_type,
        coalesce(pl.can_trench, false) as can_trench,
        coalesce(pl.can_bump, false) as can_bump,
        coalesce(pl.can_shuttle, false) as can_shuttle,
        coalesce(pl.capacity, 0) as capacity,
        coalesce(pl.weight, 0) as weight
      from event_teams et
      inner join team t on t.team_number = et.team_number
      left join team_event_metrics tem on tem.team_number = et.team_number
      left join team_match_counts tmc on tmc.team_number = et.team_number
      left join pit_latest pl on pl.team_number = et.team_number
    ),
    normalized as (
      select
        s.*,
        case
          when max(s.avg_auto_points) over () = min(s.avg_auto_points) over () then 0.0
          else ((s.avg_auto_points - min(s.avg_auto_points) over ()) / nullif(max(s.avg_auto_points) over () - min(s.avg_auto_points) over (), 0) * 100.0)
        end as auto_norm,
        case
          when max(s.avg_teleop_points) over () = min(s.avg_teleop_points) over () then 0.0
          else ((s.avg_teleop_points - min(s.avg_teleop_points) over ()) / nullif(max(s.avg_teleop_points) over () - min(s.avg_teleop_points) over (), 0) * 100.0)
        end as teleop_norm,
        case
          when max(s.avg_climb_points) over () = min(s.avg_climb_points) over () then 0.0
          else ((s.avg_climb_points - min(s.avg_climb_points) over ()) / nullif(max(s.avg_climb_points) over () - min(s.avg_climb_points) over (), 0) * 100.0)
        end as climb_norm
      from scored s
    )
    select
      n.team_number,
      n.team_name,
      n.avg_auto_points,
      n.avg_teleop_points,
      n.avg_climb_points,
      n.avg_total_points,
      n.uptime_pct,
      n.matches_scouted,
      n.scheduled_matches,
      n.consistency_score,
      (0.20 * n.auto_norm + 0.40 * n.teleop_norm + 0.20 * n.climb_norm + 0.10 * n.consistency_score + 0.10 * n.uptime_pct) as overall_score,
      rank() over (
        order by (0.20 * n.auto_norm + 0.40 * n.teleop_norm + 0.20 * n.climb_norm + 0.10 * n.consistency_score + 0.10 * n.uptime_pct) desc,
                 n.avg_total_points desc,
                 n.team_number asc
      )::int as overall_rank,
      n.drivetrain,
      n.climb_type,
      n.can_trench,
      n.can_bump,
      n.can_shuttle,
      n.capacity,
      n.weight
    from normalized n
    order by overall_score desc, n.avg_total_points desc, n.team_number asc
  `);

  const rows = (result.rows ?? []).map((row) => ({
    teamNumber: Number(row.team_number),
    teamName: row.team_name,
    avgAutoPoints: Number(row.avg_auto_points) || 0,
    avgTeleopPoints: Number(row.avg_teleop_points) || 0,
    avgClimbPoints: Number(row.avg_climb_points) || 0,
    avgTotalPoints: Number(row.avg_total_points) || 0,
    uptimePct: Number(row.uptime_pct) || 0,
    matchesScouted: Number(row.matches_scouted) || 0,
    scheduledMatches: Number(row.scheduled_matches) || 0,
    consistencyScore: Number(row.consistency_score) || 0,
    overallScore: Number(row.overall_score) || 0,
    overallRank: Number(row.overall_rank) || 0,
    drivetrain: row.drivetrain,
    climbType: row.climb_type,
    canTrench: Boolean(row.can_trench),
    canBump: Boolean(row.can_bump),
    canShuttle: Boolean(row.can_shuttle),
    capacity: Number(row.capacity) || 0,
    weight: Number(row.weight) || 0,
  } satisfies AnalysisTeamRow));

  const totalTeams = rows.length;
  const teamsScouted = rows.filter((row) => row.matchesScouted > 0).length;
  const totalMatchesScouted = rows.reduce((sum, row) => sum + row.matchesScouted, 0);
  const totalPointsWeighted = rows.reduce(
    (sum, row) => sum + row.avgTotalPoints * row.matchesScouted,
    0
  );
  const avgPointsPerMatch = totalMatchesScouted > 0 ? totalPointsWeighted / totalMatchesScouted : 0;
  const highestScoringTeam =
    rows.length > 0
      ? [...rows]
          .sort((a, b) => b.avgTotalPoints - a.avgTotalPoints || a.teamNumber - b.teamNumber)
          .at(0) ?? null
      : null;

  return {
    teams: rows,
    summary: {
      totalTeams,
      teamsScouted,
      totalMatchesScouted,
      avgPointsPerMatch,
      highestScoringTeam: highestScoringTeam
        ? {
            teamNumber: highestScoringTeam.teamNumber,
            teamName: highestScoringTeam.teamName,
            avgTotalPoints: highestScoringTeam.avgTotalPoints,
          }
        : null,
    },
  };
}
