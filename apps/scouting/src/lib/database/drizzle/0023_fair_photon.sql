ALTER TABLE "pit_form" ADD COLUMN "drivetrain_other" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "pit_form" ADD COLUMN "archetype" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "pit_form" ADD COLUMN "comments" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE VIEW "public"."v_stand_form_expected" AS (
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
);