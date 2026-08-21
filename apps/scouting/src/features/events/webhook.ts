import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  event,
  match,
  tbaMatchBreakdown,
  teamEventCopr,
  teamMatch,
} from "@/lib/database/schema/tables";
import { getTBAClient } from "@/lib/server/tba";
import { parseTbaTeamKey } from "@/lib/tba";
import { importMatchSchedule } from "./match-schedule/import";
import { tbaScheduleToImport } from "./match-schedule/sources/tba";
import type { MatchScorePayload, ScheduleUpdatedPayload } from "./webhook-schemas";

// --- HMAC verification ---

// TBA signs with Python json.dumps format (separators ": " and ", ") but sends compact JSON.
function toPythonJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(toPythonJson).join(", ")}]`;
  return `{${Object.entries(v as Record<string, unknown>)
    .map(([k, val]) => `${JSON.stringify(k)}: ${toPythonJson(val)}`)
    .join(", ")}}`;
}

export function verifyTbaHmac(rawBody: string, signature: string, secret: string): boolean {
  let normalized: string;
  try {
    normalized = toPythonJson(JSON.parse(rawBody));
  } catch {
    return false;
  }
  const computed = createHmac("sha256", secret).update(normalized).digest("hex");
  if (computed.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

// --- TBA 2026 score breakdown helpers ---

type TowerRobot2026 = "Level1" | "Level2" | "Level3" | "None";

type ScoreBreakdown2026Alliance = {
  autoTowerRobot1: TowerRobot2026;
  autoTowerRobot2: TowerRobot2026;
  autoTowerRobot3: TowerRobot2026;
  endGameTowerRobot1: TowerRobot2026;
  endGameTowerRobot2: TowerRobot2026;
  endGameTowerRobot3: TowerRobot2026;
};

function parseTowerLevel(value: TowerRobot2026): number {
  const map: Record<TowerRobot2026, number> = { Level1: 1, Level2: 2, Level3: 3, None: 0 };
  return map[value] ?? 0;
}

// --- Handlers ---

export async function processMatchScore(
  payload: MatchScorePayload
): Promise<{ updated: boolean; reason?: string }> {
  const { event_key: eventKey, match: tbaMatch } = payload.message_data;
  const { comp_level: compLevel, match_number: matchNumber } = tbaMatch;
  const { score: redScore } = tbaMatch.alliances.red;
  const { score: blueScore } = tbaMatch.alliances.blue;

  // TBA sends -1 for unplayed matches
  if (redScore < 0 || blueScore < 0) {
    return { updated: false, reason: "Match not yet played (score is -1)" };
  }

  const eventRow = await db.query.event.findFirst({
    where: eq(event.eventCode, eventKey),
    columns: { id: true },
  });
  if (!eventRow) return { updated: false, reason: `Event not in DB: ${eventKey}` };

  const matchRow = await db.query.match.findFirst({
    where: and(
      eq(match.eventId, eventRow.id),
      eq(match.matchType, compLevel),
      eq(match.matchNumber, matchNumber)
    ),
    columns: { id: true },
  });
  if (!matchRow) return { updated: false, reason: `Match not in DB: ${compLevel}${matchNumber}` };

  await db.update(match).set({ redScore, blueScore }).where(eq(match.id, matchRow.id));

  // Re-fetch COPRs — each new match result updates TBA's calculations
  try {
    const tba = getTBAClient();
    const coprs = await tba.events.getCOPRs(eventKey);
    if (coprs) {
      const autoFuel = coprs["Hub Auto Fuel Count"];
      const teleopFuel = coprs["Hub Teleop Fuel Count"];
      const endgameFuel = coprs["Hub Endgame Fuel Count"];
      const totalFuel = coprs["Hub Total Fuel Count"];

      if (autoFuel && totalFuel) {
        const coprRows = Object.keys(totalFuel).map((tbaKey) => ({
          eventId: eventRow.id,
          teamNumber: parseTbaTeamKey(tbaKey),
          autoFuelCount: String(autoFuel[tbaKey] ?? 0),
          teleopFuelCount: String(teleopFuel?.[tbaKey] ?? 0),
          endgameFuelCount: String(endgameFuel?.[tbaKey] ?? 0),
          totalFuelCount: String(totalFuel[tbaKey] ?? 0),
        }));

        if (coprRows.length > 0) {
          await db
            .insert(teamEventCopr)
            .values(coprRows)
            .onConflictDoUpdate({
              target: [teamEventCopr.eventId, teamEventCopr.teamNumber],
              set: {
                autoFuelCount: sql`excluded.auto_fuel_count`,
                teleopFuelCount: sql`excluded.teleop_fuel_count`,
                endgameFuelCount: sql`excluded.endgame_fuel_count`,
                totalFuelCount: sql`excluded.total_fuel_count`,
                updatedAt: sql`now()`,
              },
            });
        }
      }
    }
  } catch (err) {
    console.warn("[tba-webhook] failed to refresh COPRs:", err);
  }

  // Fetch full match with score breakdown and upsert climb levels
  try {
    const tba = getTBAClient();
    const matchKey = `${eventKey}_${compLevel}${matchNumber}`;
    const fullMatch = await tba.matches.getByKey(matchKey);
    if (fullMatch.year === 2026 && fullMatch.score_breakdown) {
      const breakdown = fullMatch.score_breakdown as {
        red: ScoreBreakdown2026Alliance;
        blue: ScoreBreakdown2026Alliance;
      };

      for (const alliance of ["red", "blue"] as const) {
        const allianceBreakdown = breakdown[alliance];
        const teamKeys = fullMatch.alliances[alliance].team_keys;

        for (let i = 0; i < 3; i++) {
          const teamKey = teamKeys[i];
          if (!teamKey) continue;
          const pos = (i + 1) as 1 | 2 | 3;
          const teamNumber = parseTbaTeamKey(teamKey);

          const tmRow = await db.query.teamMatch.findFirst({
            where: and(eq(teamMatch.matchId, matchRow.id), eq(teamMatch.teamNumber, teamNumber)),
            columns: { id: true },
          });
          if (!tmRow) continue;

          await db
            .insert(tbaMatchBreakdown)
            .values({
              teamMatchId: tmRow.id,
              autoClimbLevel: parseTowerLevel(allianceBreakdown[`autoTowerRobot${pos}`]),
              endgameClimbLevel: parseTowerLevel(allianceBreakdown[`endGameTowerRobot${pos}`]),
            })
            .onConflictDoUpdate({
              target: tbaMatchBreakdown.teamMatchId,
              set: {
                autoClimbLevel: sql`excluded.auto_climb_level`,
                endgameClimbLevel: sql`excluded.endgame_climb_level`,
                updatedAt: sql`now()`,
              },
            });
        }
      }
    }
  } catch (err) {
    console.warn("[tba-webhook] failed to sync score breakdown:", err);
  }

  revalidateTag(cacheTags.matchScores(eventRow.id), "max");
  revalidateTag(cacheTags.teamMetrics(eventRow.id), "max");
  revalidateTag(cacheTags.eventCoprs(eventRow.id), "max");

  return { updated: true };
}

export async function processScheduleUpdated(
  payload: ScheduleUpdatedPayload
): Promise<{ updated: boolean; reason?: string }> {
  const { event_key: eventKey } = payload.message_data;

  const eventRow = await db.query.event.findFirst({
    where: eq(event.eventCode, eventKey),
    columns: { id: true },
  });
  if (!eventRow) return { updated: false, reason: `Event not in DB: ${eventKey}` };

  const tba = getTBAClient();
  const tbaMatches = await tba.matches.getEventMatches(eventKey);
  if (!tbaMatches?.length) return { updated: false, reason: "No matches returned from TBA" };

  // Only qualifying matches — playoff matches require a set_number column to avoid key conflicts
  // (qf1m1 and qf2m1 both have match_number=1 and comp_level="qf").
  const qualMatches = tbaMatches.filter((m) => m.comp_level === "qm");
  if (!qualMatches.length) return { updated: false, reason: "No qualifying matches in schedule" };

  const schedule = tbaScheduleToImport(tbaMatches, []);

  try {
    await importMatchSchedule(eventRow.id, schedule);
  } catch (error) {
    return {
      updated: false,
      reason: error instanceof Error ? error.message : "Schedule import failed",
    };
  }

  await db.transaction(async (tx) => {
    const matchRows = await tx
      .select({ id: match.id, matchNumber: match.matchNumber })
      .from(match)
      .where(and(eq(match.eventId, eventRow.id), eq(match.matchType, "qm")));
    const matchIdByNumber = new Map(matchRows.map((row) => [row.matchNumber, row.id]));
    const breakdownValues: Array<{
      teamMatchId: number;
      autoClimbLevel: number;
      endgameClimbLevel: number;
    }> = [];

    const tmRows = await tx
      .select({ id: teamMatch.id, matchId: teamMatch.matchId, teamNumber: teamMatch.teamNumber })
      .from(teamMatch)
      .where(eq(teamMatch.eventId, eventRow.id));
    const tmIdByKey = new Map(tmRows.map((r) => [`${r.matchId}:${r.teamNumber}`, r.id]));

    for (const m of qualMatches) {
      if (m.year !== 2026 || !m.score_breakdown) continue;
      const matchId = matchIdByNumber.get(m.match_number);
      if (!matchId) continue;

      const breakdown = m.score_breakdown as {
        red: ScoreBreakdown2026Alliance;
        blue: ScoreBreakdown2026Alliance;
      };

      for (const alliance of ["red", "blue"] as const) {
        const allianceBreakdown = breakdown[alliance];
        const teamKeys = m.alliances[alliance].team_keys;

        for (let i = 0; i < 3; i++) {
          const teamKey = teamKeys[i];
          if (!teamKey) continue;
          const pos = (i + 1) as 1 | 2 | 3;
          const tmId = tmIdByKey.get(`${matchId}:${parseTbaTeamKey(teamKey)}`);
          if (!tmId) continue;

          breakdownValues.push({
            teamMatchId: tmId,
            autoClimbLevel: parseTowerLevel(allianceBreakdown[`autoTowerRobot${pos}`]),
            endgameClimbLevel: parseTowerLevel(allianceBreakdown[`endGameTowerRobot${pos}`]),
          });
        }
      }
    }

    if (breakdownValues.length > 0) {
      await tx
        .insert(tbaMatchBreakdown)
        .values(breakdownValues)
        .onConflictDoUpdate({
          target: tbaMatchBreakdown.teamMatchId,
          set: {
            autoClimbLevel: sql`excluded.auto_climb_level`,
            endgameClimbLevel: sql`excluded.endgame_climb_level`,
            updatedAt: sql`now()`,
          },
        });
    }
  });

  revalidateTag(cacheTags.teamMetrics(eventRow.id), "max");

  return { updated: true };
}
