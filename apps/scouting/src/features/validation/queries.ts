import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { match, member, standForm, teamMatch, user } from "@/lib/database/schema/tables";

// ── Score Reconciliation ─────────────────────────────────────────────────────

export type ValidationMatchScoreRow = {
  matchId: string;
  matchNumber: number;
  matchType: string;
  redScore: number;
  blueScore: number;
  expRedScore: number;
  expBlueScore: number;
  goblinMatch: number;
};

/**
 * Per-match actual vs org-scoped predicted scores.
 * Only returns matches that have been scored (red_score IS NOT NULL).
 */
export async function getValidationMatchScores(
  eventId: string,
  organizationId: string
): Promise<ValidationMatchScoreRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.matchScores(eventId));
  cacheTag(cacheTags.teamMetrics(eventId));

  // Org-scoped replicate of vMatchGoblin logic using CTEs.
  // Excludes: unplayed matches (score IS NULL or -1), and matches where any
  // team slot has no org-scoped scouting (predictions would be unreliable).
  const rows = await db.execute(sql`
    WITH org_latest AS (
      SELECT
        sf.team_match_id,
        COALESCE(sf.scout_member_id, sf.id::text) AS scout_id,
        e.exp_fuel_active,
        e.exp_tower,
        ROW_NUMBER() OVER (
          PARTITION BY sf.team_match_id, COALESCE(sf.scout_member_id, sf.id::text)
          ORDER BY sf.updated_at DESC, sf.created_at DESC
        ) AS rn
      FROM stand_form sf
      JOIN v_stand_form_expected e ON e.stand_form_id = sf.id
      JOIN member m ON m.id = sf.scout_member_id AND m.organization_id = ${organizationId}
      WHERE sf.deleted_at IS NULL
    ),
    org_consensus AS (
      SELECT
        team_match_id,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY exp_fuel_active::float) AS exp_fuel_active,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY exp_tower::float)       AS exp_tower
      FROM org_latest
      WHERE rn = 1
      GROUP BY team_match_id
    ),
    org_match_totals AS (
      SELECT
        tm.match_id,
        SUM(CASE WHEN tm.alliance = 'red'  THEN COALESCE(c.exp_fuel_active, 0) + COALESCE(c.exp_tower, 0) ELSE 0 END) AS exp_red_score,
        SUM(CASE WHEN tm.alliance = 'blue' THEN COALESCE(c.exp_fuel_active, 0) + COALESCE(c.exp_tower, 0) ELSE 0 END) AS exp_blue_score
      FROM team_match tm
      LEFT JOIN org_consensus c ON c.team_match_id = tm.id
      GROUP BY tm.match_id
    ),
    slot_coverage AS (
      SELECT
        tm.match_id,
        COUNT(*)                                                                     AS total_slots,
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM stand_form sf2
          JOIN member m2 ON m2.id = sf2.scout_member_id
          WHERE sf2.team_match_id = tm.id
            AND sf2.deleted_at IS NULL
            AND m2.organization_id = ${organizationId}
        ) THEN 1 ELSE 0 END)                                                         AS covered_slots
      FROM team_match tm
      WHERE tm.event_id = ${eventId}
      GROUP BY tm.match_id
    )
    SELECT
      m.id            AS match_id,
      m.match_number,
      m.match_type,
      m.red_score,
      m.blue_score,
      COALESCE(mt.exp_red_score,  0)::float AS exp_red_score,
      COALESCE(mt.exp_blue_score, 0)::float AS exp_blue_score,
      (
        (m.red_score  - m.blue_score)
        - (COALESCE(mt.exp_red_score, 0) - COALESCE(mt.exp_blue_score, 0))
      )::float AS goblin_match
    FROM match m
    LEFT JOIN org_match_totals mt ON mt.match_id = m.id
    JOIN slot_coverage sc ON sc.match_id = m.id AND sc.covered_slots = sc.total_slots
    WHERE m.event_id = ${eventId}
      AND m.red_score IS NOT NULL
      AND m.red_score >= 0
    ORDER BY m.match_number
  `);

  return (rows.rows as Array<Record<string, unknown>>).map((r) => ({
    matchId: r.match_id as string,
    matchNumber: Number(r.match_number),
    matchType: r.match_type as string,
    redScore: Number(r.red_score),
    blueScore: Number(r.blue_score),
    expRedScore: Number(r.exp_red_score),
    expBlueScore: Number(r.exp_blue_score),
    goblinMatch: Number(r.goblin_match),
  }));
}

// ── Scout Coverage ───────────────────────────────────────────────────────────

export type ScoutCoverageRow = {
  teamMatchId: number;
  matchNumber: number;
  teamNumber: number;
  alliance: string;
  position: number;
  scoutCount: number;
};

/**
 * Per-slot scout count scoped to this org's members.
 */
export async function getScoutCoverage(
  eventId: string,
  organizationId: string
): Promise<ScoutCoverageRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.eventTeams(eventId));
  cacheTag(cacheTags.teamMetrics(eventId));

  const rows = await db
    .select({
      teamMatchId: teamMatch.id,
      matchNumber: match.matchNumber,
      teamNumber: teamMatch.teamNumber,
      alliance: teamMatch.alliance,
      position: teamMatch.position,
      scoutCount: sql<number>`count(${standForm.id})::int`,
    })
    .from(teamMatch)
    .innerJoin(match, eq(match.id, teamMatch.matchId))
    .leftJoin(
      standForm,
      and(
        eq(standForm.teamMatchId, teamMatch.id),
        isNull(standForm.deletedAt),
        sql`(${standForm.scoutMemberId} IS NULL OR ${standForm.scoutMemberId} IN (
          SELECT id FROM member WHERE organization_id = ${organizationId}
        ))`
      )
    )
    .where(eq(teamMatch.eventId, eventId))
    .groupBy(
      teamMatch.id,
      match.matchNumber,
      teamMatch.teamNumber,
      teamMatch.alliance,
      teamMatch.position
    )
    .orderBy(match.matchNumber, teamMatch.alliance, teamMatch.position);

  return rows.map((r) => ({
    teamMatchId: r.teamMatchId,
    matchNumber: r.matchNumber,
    teamNumber: r.teamNumber,
    alliance: r.alliance,
    position: r.position,
    scoutCount: r.scoutCount ?? 0,
  }));
}

// ── Flagged Forms ────────────────────────────────────────────────────────────

export type FlaggedFormRow = {
  formId: string;
  scoutName: string | null;
  teamNumber: number;
  matchNumber: number;
  oofTimeSeconds: number;
  cycleCount: number;
  climbCount: number;
  reason: "empty" | "broken";
  createdAt: Date;
};

/**
 * Stand forms with suspiciously empty or broken data, scoped to this org.
 */
export async function getFlaggedForms(
  eventId: string,
  organizationId: string
): Promise<FlaggedFormRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.teamMetrics(eventId));

  const rows = await db
    .select({
      formId: standForm.id,
      scoutName: user.name,
      teamNumber: teamMatch.teamNumber,
      matchNumber: match.matchNumber,
      oofTimeSeconds: standForm.oofTimeSeconds,
      cycleCount: sql<number>`(SELECT count(*)::int FROM cycle WHERE stand_form_id = ${standForm.id})`,
      climbCount: sql<number>`(SELECT count(*)::int FROM climb WHERE stand_form_id = ${standForm.id})`,
      createdAt: standForm.createdAt,
    })
    .from(standForm)
    .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
    .innerJoin(match, eq(match.id, teamMatch.matchId))
    .innerJoin(
      member,
      and(eq(member.id, standForm.scoutMemberId), eq(member.organizationId, organizationId))
    )
    .leftJoin(user, eq(user.id, member.userId))
    .where(
      and(
        eq(teamMatch.eventId, eventId),
        isNull(standForm.deletedAt),
        sql`(
          (
            ${standForm.oofTimeSeconds} = 0
            AND (SELECT count(*) FROM cycle WHERE stand_form_id = ${standForm.id}) = 0
            AND (SELECT count(*) FROM climb WHERE stand_form_id = ${standForm.id}) = 0
          )
          OR ${standForm.oofTimeSeconds} >= 130
        )`
      )
    )
    .orderBy(match.matchNumber);

  return rows.map((r) => ({
    formId: r.formId,
    scoutName: r.scoutName ?? null,
    teamNumber: r.teamNumber,
    matchNumber: r.matchNumber,
    oofTimeSeconds: r.oofTimeSeconds,
    cycleCount: r.cycleCount ?? 0,
    climbCount: r.climbCount ?? 0,
    reason: (r.oofTimeSeconds ?? 0) >= 130 ? "broken" : "empty",
    createdAt: r.createdAt,
  }));
}

// ── Summary ──────────────────────────────────────────────────────────────────

export type ValidationSummary = {
  playedMatchCount: number;
  avgAbsGoblin: number;
  totalSlots: number;
  scoutedSlots: number;
  singleScoutSlots: number;
};

/**
 * Aggregated health stats for the event, org-scoped.
 */
export async function getValidationSummary(
  eventId: string,
  organizationId: string
): Promise<ValidationSummary> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.matchScores(eventId));
  cacheTag(cacheTags.teamMetrics(eventId));
  cacheTag(cacheTags.eventTeams(eventId));

  const [playedResult, slotResult] = await Promise.all([
    // Org-scoped goblin per played match
    db.execute(sql`
      WITH org_latest AS (
        SELECT
          sf.team_match_id,
          COALESCE(sf.scout_member_id, sf.id::text) AS scout_id,
          e.exp_fuel_active,
          e.exp_tower,
          ROW_NUMBER() OVER (
            PARTITION BY sf.team_match_id, COALESCE(sf.scout_member_id, sf.id::text)
            ORDER BY sf.updated_at DESC, sf.created_at DESC
          ) AS rn
        FROM stand_form sf
        JOIN v_stand_form_expected e ON e.stand_form_id = sf.id
        JOIN member m ON m.id = sf.scout_member_id AND m.organization_id = ${organizationId}
        WHERE sf.deleted_at IS NULL
      ),
      org_consensus AS (
        SELECT
          team_match_id,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY exp_fuel_active::float) AS exp_fuel_active,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY exp_tower::float)       AS exp_tower
        FROM org_latest WHERE rn = 1
        GROUP BY team_match_id
      ),
      org_match_totals AS (
        SELECT
          tm.match_id,
          SUM(CASE WHEN tm.alliance = 'red'  THEN COALESCE(c.exp_fuel_active, 0) + COALESCE(c.exp_tower, 0) ELSE 0 END) AS exp_red_score,
          SUM(CASE WHEN tm.alliance = 'blue' THEN COALESCE(c.exp_fuel_active, 0) + COALESCE(c.exp_tower, 0) ELSE 0 END) AS exp_blue_score
        FROM team_match tm
        LEFT JOIN org_consensus c ON c.team_match_id = tm.id
        GROUP BY tm.match_id
      )
      SELECT
        count(m.id)::int AS played_match_count,
        AVG(ABS(
          (m.red_score - m.blue_score)
          - (COALESCE(mt.exp_red_score, 0) - COALESCE(mt.exp_blue_score, 0))
        ))::float AS avg_abs_goblin
      FROM match m
      LEFT JOIN org_match_totals mt ON mt.match_id = m.id
      WHERE m.event_id = ${eventId}
        AND m.red_score IS NOT NULL
        AND m.red_score >= 0
    `),

    // Slot coverage (org-scoped stand form counts)
    db
      .select({
        teamMatchId: teamMatch.id,
        scoutCount: sql<number>`count(${standForm.id})::int`,
      })
      .from(teamMatch)
      .innerJoin(match, eq(match.id, teamMatch.matchId))
      .leftJoin(
        standForm,
        and(
          eq(standForm.teamMatchId, teamMatch.id),
          isNull(standForm.deletedAt),
          sql`(${standForm.scoutMemberId} IS NULL OR ${standForm.scoutMemberId} IN (
            SELECT id FROM member WHERE organization_id = ${organizationId}
          ))`
        )
      )
      .where(eq(teamMatch.eventId, eventId))
      .groupBy(teamMatch.id),
  ]);

  const playedRow = (playedResult.rows as Array<Record<string, unknown>>)[0];
  const playedMatchCount = Number(playedRow?.played_match_count ?? 0);
  const avgAbsGoblin = Number(playedRow?.avg_abs_goblin ?? 0);

  const slots = slotResult;
  const totalSlots = slots.length;
  const scoutedSlots = slots.filter((s) => (s.scoutCount ?? 0) >= 1).length;
  const singleScoutSlots = slots.filter((s) => (s.scoutCount ?? 0) === 1).length;

  return {
    playedMatchCount,
    avgAbsGoblin,
    totalSlots,
    scoutedSlots,
    singleScoutSlots,
  };
}
