import { sql } from "drizzle-orm";
import { bigint, integer, numeric, pgView, text, uuid } from "drizzle-orm/pg-core";

export const vStandFormExpected = pgView("v_stand_form_expected", {
  standFormId: uuid("stand_form_id").notNull(),
  teamMatchId: bigint("team_match_id", { mode: "number" }).notNull(),

  expFuelActive: numeric("exp_fuel_active", { precision: 18, scale: 6 }).notNull(),
  expTower: numeric("exp_tower", { precision: 18, scale: 6 }).notNull(),
  clankMatch: numeric("clank_match", { precision: 18, scale: 6 }).notNull(),

  pureClimbTotal: numeric("pure_climb_total", { precision: 18, scale: 6 }).notNull(),
  pureClimbAuto: numeric("pure_climb_auto", { precision: 18, scale: 6 }).notNull(),
  pureClimbTeleop: numeric("pure_climb_teleop", { precision: 18, scale: 6 }).notNull(),

  cyclesCount: integer("cycles_count").notNull(),
}).as(sql`
  with form_phase_duration as (
    -- Total dump duration per stand form per phase (single match).
    -- COPR fuel counts are per-match estimates, so we distribute them
    -- across cycles within the same match proportionally by dump duration.
    select
      c.stand_form_id,
      c.phase,
      sum(greatest(coalesce(c.dump_duration, 0.0), 0.0)) as total_duration
    from cycle c
    join stand_form sf2 on sf2.id = c.stand_form_id
    where sf2.deleted_at is null
    group by c.stand_form_id, c.phase
  ),
  cycle_fuel as (
    select
      c.stand_form_id,
      sum(
        case
          when fpd.total_duration > 0 then
            (case c.phase
              when 'auto' then coalesce(copr.auto_fuel_count, 0.0)
              when 'teleop' then coalesce(copr.teleop_fuel_count, 0.0)
              else 0.0
            end)
            / fpd.total_duration
            * greatest(coalesce(c.dump_duration, 0.0), 0.0)
          else 0.0
        end
      ) as fuel_active,
      count(*) as cycles_count
    from cycle c
    join stand_form sf3 on sf3.id = c.stand_form_id
    join team_match tm on tm.id = sf3.team_match_id
    left join team_event_copr copr on copr.event_id = tm.event_id and copr.team_number = tm.team_number
    left join form_phase_duration fpd on fpd.stand_form_id = c.stand_form_id and fpd.phase = c.phase
    where sf3.deleted_at is null
    group by c.stand_form_id
  ),
  climb_pts as (
    select
      sf2.id as stand_form_id,
      -- Auto climb points from TBA
      (case
        when bd.auto_climb_level is null or bd.auto_climb_level = 0 then 0.0
        when bd.auto_climb_level = 1 then 15.0
        when bd.auto_climb_level = 2 then 20.0
        when bd.auto_climb_level = 3 then 30.0
        else 0.0
      end) as pure_climb_auto,
      -- Endgame climb points from TBA
      (case
        when bd.endgame_climb_level is null or bd.endgame_climb_level = 0 then 0.0
        when bd.endgame_climb_level = 1 then 10.0
        when bd.endgame_climb_level = 2 then 20.0
        when bd.endgame_climb_level = 3 then 30.0
        else 0.0
      end) as pure_climb_teleop,
      -- Combined climb points
      (case
        when bd.auto_climb_level is null or bd.auto_climb_level = 0 then 0.0
        when bd.auto_climb_level = 1 then 15.0
        when bd.auto_climb_level = 2 then 20.0
        when bd.auto_climb_level = 3 then 30.0
        else 0.0
      end)
      +
      (case
        when bd.endgame_climb_level is null or bd.endgame_climb_level = 0 then 0.0
        when bd.endgame_climb_level = 1 then 10.0
        when bd.endgame_climb_level = 2 then 20.0
        when bd.endgame_climb_level = 3 then 30.0
        else 0.0
      end) as pure_climb_total,
      -- Time bonus from latest scout-reported climb attempt
      (case
        when bd.auto_climb_level is null or bd.auto_climb_level = 0 then 0.0
        when bd.auto_climb_level = 1 then 15.0
        when bd.auto_climb_level = 2 then 20.0
        when bd.auto_climb_level = 3 then 30.0
        else 0.0
      end)
      +
      (case
        when bd.endgame_climb_level is null or bd.endgame_climb_level = 0 then 0.0
        when bd.endgame_climb_level = 1 then 10.0
        when bd.endgame_climb_level = 2 then 20.0
        when bd.endgame_climb_level = 3 then 30.0
        else 0.0
      end)
      +
      coalesce(
        (select case
          when cl.climb_duration <= 3.0 then 2.0
          when cl.climb_duration <= 6.0 then 0.0
          else -2.0
         end
         from climb cl where cl.stand_form_id = sf2.id
         order by cl.created_at desc limit 1),
        0.0
      ) as total_climb_pts
    from stand_form sf2
    join team_match tm2 on tm2.id = sf2.team_match_id
    left join tba_match_breakdown bd on bd.team_match_id = tm2.id
    where sf2.deleted_at is null
  )
  select
    sf.id as stand_form_id,
    sf.team_match_id,

    coalesce(cf.fuel_active, 0.0) as exp_fuel_active,

    coalesce(cp.total_climb_pts, 0.0) as exp_tower,
    coalesce(cp.total_climb_pts, 0.0) as clank_match,

    coalesce(cp.pure_climb_total, 0.0) as pure_climb_total,
    coalesce(cp.pure_climb_auto,  0.0) as pure_climb_auto,
    coalesce(cp.pure_climb_teleop, 0.0) as pure_climb_teleop,

    coalesce(cf.cycles_count, 0)::int as cycles_count
  from stand_form sf
  left join cycle_fuel cf on cf.stand_form_id = sf.id
  left join climb_pts cp on cp.stand_form_id = sf.id
  where sf.deleted_at is null
`);

export const vTeamMatchScoutLatest = pgView("v_team_match_scout_latest", {
  teamMatchId: bigint("team_match_id", { mode: "number" }).notNull(),
  scoutMemberId: text("scout_member_id").notNull(), // now a "voter id"

  expFuelActive: numeric("exp_fuel_active", { precision: 18, scale: 6 }).notNull(),
  expTower: numeric("exp_tower", { precision: 18, scale: 6 }).notNull(),
  clankMatch: numeric("clank_match", { precision: 18, scale: 6 }).notNull(),

  pureClimbTotal: numeric("pure_climb_total", { precision: 18, scale: 6 }).notNull(),
  pureClimbAuto: numeric("pure_climb_auto", { precision: 18, scale: 6 }).notNull(),
  pureClimbTeleop: numeric("pure_climb_teleop", { precision: 18, scale: 6 }).notNull(),
}).as(sql`
    with ranked as (
      select
        sf.team_match_id,

        -- voter id: real scout if present, otherwise stand_form id (prevents dropping rows)
        coalesce(sf.scout_member_id, sf.id::text) as scout_member_id,

        e.exp_fuel_active,
        e.exp_tower,
        e.clank_match,
        e.pure_climb_total,
        e.pure_climb_auto,
        e.pure_climb_teleop,

        row_number() over (
          partition by sf.team_match_id, coalesce(sf.scout_member_id, sf.id::text)
          order by sf.updated_at desc, sf.created_at desc
        ) as rn
      from stand_form sf
      join v_stand_form_expected e on e.stand_form_id = sf.id
      where sf.deleted_at is null
    )
    select
      team_match_id,
      scout_member_id,
      exp_fuel_active,
      exp_tower,
      clank_match,
      pure_climb_total,
      pure_climb_auto,
      pure_climb_teleop
    from ranked
    where rn = 1
  `);

export const vTeamMatchConsensus = pgView("v_team_match_consensus", {
  teamMatchId: bigint("team_match_id", { mode: "number" }).notNull(),

  expFuelActive: numeric("exp_fuel_active", { precision: 18, scale: 6 }).notNull(),
  expTower: numeric("exp_tower", { precision: 18, scale: 6 }).notNull(),
  clank: numeric("clank", { precision: 18, scale: 6 }).notNull(),

  pureClimbTotal: numeric("pure_climb_total", { precision: 18, scale: 6 }).notNull(),
  pureClimbAuto: numeric("pure_climb_auto", { precision: 18, scale: 6 }).notNull(),
  pureClimbTeleop: numeric("pure_climb_teleop", { precision: 18, scale: 6 }).notNull(),

  nScouts: integer("n_scouts").notNull(),
}).as(sql`
    select
      l.team_match_id,
      percentile_cont(0.5) within group (order by l.exp_fuel_active)    as exp_fuel_active,
      percentile_cont(0.5) within group (order by l.exp_tower)          as exp_tower,
      percentile_cont(0.5) within group (order by l.clank_match)        as clank,
      percentile_cont(0.5) within group (order by l.pure_climb_total)   as pure_climb_total,
      percentile_cont(0.5) within group (order by l.pure_climb_auto)    as pure_climb_auto,
      percentile_cont(0.5) within group (order by l.pure_climb_teleop)  as pure_climb_teleop,
      count(*)::int as n_scouts
    from v_team_match_scout_latest l
    group by l.team_match_id
  `);

export const vMatchExpectedTotals = pgView("v_match_expected_totals", {
  matchId: uuid("match_id").notNull(),

  expRedFuelActive: numeric("exp_red_fuel_active", { precision: 18, scale: 6 }).notNull(),
  expBlueFuelActive: numeric("exp_blue_fuel_active", { precision: 18, scale: 6 }).notNull(),

  expRedTower: numeric("exp_red_tower", { precision: 18, scale: 6 }).notNull(),
  expBlueTower: numeric("exp_blue_tower", { precision: 18, scale: 6 }).notNull(),

  expRedScore: numeric("exp_red_score", { precision: 18, scale: 6 }).notNull(),
  expBlueScore: numeric("exp_blue_score", { precision: 18, scale: 6 }).notNull(),
}).as(sql`
    select
      tm.match_id,
  
      sum(case when tm.alliance='red'  then coalesce(c.exp_fuel_active, 0.0) else 0.0 end) as exp_red_fuel_active,
      sum(case when tm.alliance='blue' then coalesce(c.exp_fuel_active, 0.0) else 0.0 end) as exp_blue_fuel_active,
  
      sum(case when tm.alliance='red'  then coalesce(c.exp_tower, 0.0) else 0.0 end) as exp_red_tower,
      sum(case when tm.alliance='blue' then coalesce(c.exp_tower, 0.0) else 0.0 end) as exp_blue_tower,
  
      sum(case when tm.alliance='red'  then (coalesce(c.exp_fuel_active,0.0)+coalesce(c.exp_tower,0.0)) else 0.0 end) as exp_red_score,
      sum(case when tm.alliance='blue' then (coalesce(c.exp_fuel_active,0.0)+coalesce(c.exp_tower,0.0)) else 0.0 end) as exp_blue_score
  
    from team_match tm
    left join v_team_match_consensus c on c.team_match_id = tm.id
    group by tm.match_id
  `);

export const vMatchGoblin = pgView("v_match_goblin", {
  matchId: uuid("match_id").notNull(),
  redScore: integer("red_score"),
  blueScore: integer("blue_score"),

  expRedScore: numeric("exp_red_score", { precision: 18, scale: 6 }).notNull(),
  expBlueScore: numeric("exp_blue_score", { precision: 18, scale: 6 }).notNull(),

  actualMargin: integer("actual_margin"),
  expMargin: numeric("exp_margin", { precision: 18, scale: 6 }).notNull(),

  goblinMatch: numeric("goblin_match", { precision: 18, scale: 6 }).notNull(),
}).as(sql`
    select
      m.id as match_id,
      m.red_score,
      m.blue_score,
      met.exp_red_score,
      met.exp_blue_score,
      (m.red_score - m.blue_score) as actual_margin,
      (met.exp_red_score - met.exp_blue_score) as exp_margin,
      ((m.red_score - m.blue_score) - (met.exp_red_score - met.exp_blue_score)) as goblin_match
    from match m
    join v_match_expected_totals met on met.match_id = m.id
    where m.red_score is not null and m.blue_score is not null
  `);

export const vTeamGoblinMatch = pgView("v_team_goblin_match", {
  teamNumber: integer("team_number").notNull(),
  matchId: uuid("match_id").notNull(),
  goblinTeamMatch: numeric("goblin_team_match", { precision: 18, scale: 6 }).notNull(),
}).as(sql`
    select
      tm.team_number,
      tm.match_id,
      case
        when tm.alliance='red' then (mg.goblin_match / 3.0)
        else (-mg.goblin_match / 3.0)
      end as goblin_team_match
    from team_match tm
    join v_match_goblin mg on mg.match_id = tm.match_id
  `);

export const vTeamGoblin = pgView("v_team_goblin", {
  teamNumber: integer("team_number").notNull(),
  goblinPerMatch: numeric("goblin_per_match", { precision: 18, scale: 6 }).notNull(),
  goblinTotal: numeric("goblin_total", { precision: 18, scale: 6 }).notNull(),
  matchesCount: integer("matches_count").notNull(),
}).as(sql`
    select
      team_number,
      avg(goblin_team_match) as goblin_per_match,
      sum(goblin_team_match) as goblin_total,
      count(*)::int as matches_count
    from v_team_goblin_match
    group by team_number
  `);

export const vTeamRpMagicMatch = pgView("v_team_rpmagic_match", {
  teamNumber: integer("team_number").notNull(),
  matchId: uuid("match_id").notNull(),

  rpmagicFuel100: numeric("rpmagic_fuel_100", { precision: 18, scale: 6 }).notNull(),
  rpmagicFuel360: numeric("rpmagic_fuel_360", { precision: 18, scale: 6 }).notNull(),
  rpmagicTower: numeric("rpmagic_tower", { precision: 18, scale: 6 }).notNull(),
  rpmagicTotal: numeric("rpmagic_total", { precision: 18, scale: 6 }).notNull(),
}).as(sql`
    with per_team as (
      select
        tm.match_id,
        tm.team_number,
        tm.alliance,
        coalesce(c.exp_fuel_active, 0.0) as f_k,
        coalesce(c.exp_tower, 0.0)       as t_k
      from team_match tm
      left join v_team_match_consensus c on c.team_match_id = tm.id
    ),
    totals as (
      select
        match_id,
        sum(case when alliance='red'  then f_k else 0.0 end) as red_f,
        sum(case when alliance='blue' then f_k else 0.0 end) as blue_f,
        sum(case when alliance='red'  then t_k else 0.0 end) as red_t,
        sum(case when alliance='blue' then t_k else 0.0 end) as blue_t
      from per_team
      group by match_id
    ),
    calc as (
      select
        p.match_id,
        p.team_number,
        p.alliance,
        case when p.alliance='red' then t.red_f else t.blue_f end as f_with,
        case when p.alliance='red' then t.red_t else t.blue_t end as t_with,
        (case when p.alliance='red' then t.red_f else t.blue_f end) - p.f_k as f_without,
        (case when p.alliance='red' then t.red_t else t.blue_t end) - p.t_k as t_without
      from per_team p
      join totals t on t.match_id = p.match_id
    ),
    consts as (
      select
        100.0::float as th100,  15.0::float as sf100,
        360.0::float as th360,  30.0::float as sf360,
         50.0::float as thT,     7.0::float as sT
    )
    select
      c.team_number,
      c.match_id,
  
      (
        (1.0 / (1.0 + exp(-((c.f_with    - k.th100) / k.sf100))))
        -
        (1.0 / (1.0 + exp(-((c.f_without - k.th100) / k.sf100))))
      ) as rpmagic_fuel_100,
  
      (
        (1.0 / (1.0 + exp(-((c.f_with    - k.th360) / k.sf360))))
        -
        (1.0 / (1.0 + exp(-((c.f_without - k.th360) / k.sf360))))
      ) as rpmagic_fuel_360,
  
      (
        (1.0 / (1.0 + exp(-((c.t_with    - k.thT) / k.sT))))
        -
        (1.0 / (1.0 + exp(-((c.t_without - k.thT) / k.sT))))
      ) as rpmagic_tower,
  
      (
        (
          (1.0 / (1.0 + exp(-((c.f_with    - k.th100) / k.sf100))))
          -
          (1.0 / (1.0 + exp(-((c.f_without - k.th100) / k.sf100))))
        )
        +
        (
          (1.0 / (1.0 + exp(-((c.f_with    - k.th360) / k.sf360))))
          -
          (1.0 / (1.0 + exp(-((c.f_without - k.th360) / k.sf360))))
        )
        +
        (
          (1.0 / (1.0 + exp(-((c.t_with    - k.thT) / k.sT))))
          -
          (1.0 / (1.0 + exp(-((c.t_without - k.thT) / k.sT))))
        )
      ) as rpmagic_total
    from calc c
    cross join consts k
  `);

export const vTeamRpMagic = pgView("v_team_rpmagic", {
  teamNumber: integer("team_number").notNull(),
  rpmagicPerMatch: numeric("rpmagic_per_match", { precision: 18, scale: 6 }).notNull(),
  rpmagicFuel100PerMatch: numeric("rpmagic_fuel_100_per_match", {
    precision: 18,
    scale: 6,
  }).notNull(),
  rpmagicFuel360PerMatch: numeric("rpmagic_fuel_360_per_match", {
    precision: 18,
    scale: 6,
  }).notNull(),
  rpmagicTowerPerMatch: numeric("rpmagic_tower_per_match", { precision: 18, scale: 6 }).notNull(),
  matchesCount: integer("matches_count").notNull(),
}).as(sql`
    select
      team_number,
      avg(rpmagic_total)    as rpmagic_per_match,
      avg(rpmagic_fuel_100) as rpmagic_fuel_100_per_match,
      avg(rpmagic_fuel_360) as rpmagic_fuel_360_per_match,
      avg(rpmagic_tower)    as rpmagic_tower_per_match,
      count(*)::int         as matches_count
    from v_team_rpmagic_match
    group by team_number
  `);

export const vTeamClank = pgView("v_team_clank", {
  teamNumber: integer("team_number").notNull(),
  clankPerMatch: numeric("clank_per_match", { precision: 18, scale: 6 }).notNull(),
  matchesCount: integer("matches_count").notNull(),
}).as(sql`
    select
      tm.team_number,
      avg(coalesce(c.clank, 0.0)) as clank_per_match,
      count(*)::int as matches_count
    from team_match tm
    left join v_team_match_consensus c on c.team_match_id = tm.id
    group by tm.team_number
  `);
