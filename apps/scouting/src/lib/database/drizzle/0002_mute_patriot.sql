CREATE OR REPLACE VIEW "public"."v_team_match_scout_latest" AS (
    with ranked as (
      select
        sf.team_match_id,
  
        -- voter id: real scout if present, otherwise stand_form id (prevents dropping rows)
        coalesce(sf.scout_member_id, sf.id::text) as scout_member_id,
  
        e.exp_fuel_active,
        e.exp_tower,
        e.clank_match,
  
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
      clank_match
    from ranked
    where rn = 1
  );