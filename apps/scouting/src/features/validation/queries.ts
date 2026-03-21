import "server-only";

import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  climb,
  cycle,
  match,
  member,
  standForm,
  teamMatch,
  user,
} from "@/lib/database/schema/tables";

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
 * Only returns scored matches (red_score >= 0) where every team slot has
 * at least one org-scoped stand form (so predictions are never missing a robot).
 */
export async function getValidationMatchScores(
  eventId: string,
  organizationId: string
): Promise<ValidationMatchScoreRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.matchScores(eventId));
  cacheTag(cacheTags.teamMetrics(eventId));

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
    org_forms AS (
      SELECT sf.team_match_id
      FROM stand_form sf
      JOIN member m ON m.id = sf.scout_member_id AND m.organization_id = ${organizationId}
      WHERE sf.deleted_at IS NULL
    ),
    slot_coverage AS (
      SELECT
        tm.match_id,
        COUNT(DISTINCT tm.id)                                         AS total_slots,
        COUNT(DISTINCT CASE WHEN f.team_match_id IS NOT NULL THEN tm.id END) AS covered_slots
      FROM team_match tm
      LEFT JOIN org_forms f ON f.team_match_id = tm.id
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
 * Uses LEFT JOINs with aggregation instead of correlated subqueries.
 */
export async function getFlaggedForms(
  eventId: string,
  organizationId: string
): Promise<FlaggedFormRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.teamMetrics(eventId));

  const cycleCount = sql<number>`count(DISTINCT ${cycle.id})::int`;
  const climbCount = sql<number>`count(DISTINCT ${climb.id})::int`;

  const rows = await db
    .select({
      formId: standForm.id,
      scoutName: user.name,
      teamNumber: teamMatch.teamNumber,
      matchNumber: match.matchNumber,
      oofTimeSeconds: standForm.oofTimeSeconds,
      cycleCount,
      climbCount,
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
    .leftJoin(cycle, eq(cycle.standFormId, standForm.id))
    .leftJoin(climb, eq(climb.standFormId, standForm.id))
    .where(and(eq(teamMatch.eventId, eventId), isNull(standForm.deletedAt)))
    .groupBy(
      standForm.id,
      user.name,
      teamMatch.teamNumber,
      match.matchNumber,
      standForm.oofTimeSeconds,
      standForm.createdAt
    )
    .having(
      sql`(
        count(DISTINCT ${cycle.id}) = 0
        AND count(DISTINCT ${climb.id}) = 0
        AND ${standForm.oofTimeSeconds} = 0
      ) OR ${standForm.oofTimeSeconds} >= 130`
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

// ── Duplicate Forms ─────────────────────────────────────────────────────────

export type DuplicateFormGroup = {
  scoutName: string | null;
  teamNumber: number;
  matchNumber: number;
  forms: {
    formId: string;
    createdAt: Date;
    cycleCount: number;
    climbCount: number;
    oofTimeSeconds: number;
  }[];
};

/**
 * Finds stand forms where the same scout submitted multiple forms for the same
 * team-match slot. Groups by (scout, team_match) so admins can pick which to keep.
 */
export async function getDuplicateForms(
  eventId: string,
  organizationId: string
): Promise<DuplicateFormGroup[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.teamMetrics(eventId));

  // Step 1: find (team_match_id, scout_member_id) combos with >1 form
  const dupes = await db
    .select({
      teamMatchId: standForm.teamMatchId,
      scoutMemberId: standForm.scoutMemberId,
      count: sql<number>`count(*)::int`,
    })
    .from(standForm)
    .innerJoin(
      member,
      and(eq(member.id, standForm.scoutMemberId), eq(member.organizationId, organizationId))
    )
    .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
    .where(and(eq(teamMatch.eventId, eventId), isNull(standForm.deletedAt)))
    .groupBy(standForm.teamMatchId, standForm.scoutMemberId)
    .having(sql`count(*) > 1`);

  if (dupes.length === 0) return [];

  // Step 2: fetch all forms for those duplicate combos
  const cycleCount = sql<number>`count(DISTINCT ${cycle.id})::int`;
  const climbCount = sql<number>`count(DISTINCT ${climb.id})::int`;

  const dupeConditions = dupes.map(
    (d) =>
      sql`(${standForm.teamMatchId} = ${d.teamMatchId} AND ${standForm.scoutMemberId} = ${d.scoutMemberId})`
  );

  const rows = await db
    .select({
      formId: standForm.id,
      scoutName: user.name,
      scoutMemberId: standForm.scoutMemberId,
      teamMatchId: standForm.teamMatchId,
      teamNumber: teamMatch.teamNumber,
      matchNumber: match.matchNumber,
      oofTimeSeconds: standForm.oofTimeSeconds,
      cycleCount,
      climbCount,
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
    .leftJoin(cycle, eq(cycle.standFormId, standForm.id))
    .leftJoin(climb, eq(climb.standFormId, standForm.id))
    .where(
      and(
        eq(teamMatch.eventId, eventId),
        isNull(standForm.deletedAt),
        sql.join(dupeConditions, sql` OR `)
      )
    )
    .groupBy(
      standForm.id,
      user.name,
      standForm.scoutMemberId,
      standForm.teamMatchId,
      teamMatch.teamNumber,
      match.matchNumber,
      standForm.oofTimeSeconds,
      standForm.createdAt
    )
    .orderBy(match.matchNumber, standForm.createdAt);

  // Step 3: group into DuplicateFormGroup[]
  const groupMap = new Map<string, DuplicateFormGroup>();
  for (const r of rows) {
    const key = `${r.teamMatchId}-${r.scoutMemberId}`;
    let group = groupMap.get(key);
    if (!group) {
      group = {
        scoutName: r.scoutName ?? null,
        teamNumber: r.teamNumber,
        matchNumber: r.matchNumber,
        forms: [],
      };
      groupMap.set(key, group);
    }
    group.forms.push({
      formId: r.formId,
      createdAt: r.createdAt,
      cycleCount: r.cycleCount ?? 0,
      climbCount: r.climbCount ?? 0,
      oofTimeSeconds: r.oofTimeSeconds,
    });
  }

  return Array.from(groupMap.values());
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
 * Reuses cached getValidationMatchScores + getScoutCoverage to avoid
 * duplicating the org-consensus CTE SQL.
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

  const [playedCountResult, matchScores, coverage] = await Promise.all([
    // Simple count of all TBA-scored matches (independent of coverage)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(match)
      .where(
        and(eq(match.eventId, eventId), isNotNull(match.redScore), sql`${match.redScore} >= 0`)
      ),
    getValidationMatchScores(eventId, organizationId),
    getScoutCoverage(eventId, organizationId),
  ]);

  const playedMatchCount = playedCountResult[0]?.count ?? 0;
  const avgAbsGoblin =
    matchScores.length > 0
      ? matchScores.reduce((sum, r) => sum + Math.abs(r.goblinMatch), 0) / matchScores.length
      : 0;

  return {
    playedMatchCount,
    avgAbsGoblin,
    totalSlots: coverage.length,
    scoutedSlots: coverage.filter((s) => s.scoutCount >= 1).length,
    singleScoutSlots: coverage.filter((s) => s.scoutCount === 1).length,
  };
}
