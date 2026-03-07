import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { event, match, team, teamMatch } from "@/lib/database/schema/tables";
import { getTBAClient, parseTbaTeamKey } from "@/lib/server/tba";
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

  revalidateTag(cacheTags.matchScores(eventRow.id), "max");
  revalidateTag(cacheTags.teamMetrics(eventRow.id), "max");

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

  await db.transaction(async (tx) => {
    // Upsert matches. ON CONFLICT DO UPDATE never deletes — team_match IDs stay stable,
    // preserving all stand form links even if this fires mid-event.
    const upsertedMatches = await tx
      .insert(match)
      .values(
        qualMatches.map((m) => ({
          eventId: eventRow.id,
          matchType: "qm" as const,
          matchNumber: m.match_number,
          redScore: m.alliances.red.score >= 0 ? m.alliances.red.score : null,
          blueScore: m.alliances.blue.score >= 0 ? m.alliances.blue.score : null,
        }))
      )
      .onConflictDoUpdate({
        target: [match.eventId, match.matchNumber, match.matchType],
        set: {
          redScore: sql`excluded.red_score`,
          blueScore: sql`excluded.blue_score`,
        },
      })
      .returning({ id: match.id, matchNumber: match.matchNumber });
    const matchIdByNumber = new Map(upsertedMatches.map((r) => [r.matchNumber, r.id]));

    const teamMatchRows: Array<{
      eventId: string;
      matchId: string;
      teamNumber: number;
      alliance: "red" | "blue";
      position: 1 | 2 | 3;
      surrogate: boolean;
    }> = [];
    const teamNumbers = new Set<number>();

    for (const m of qualMatches) {
      const matchId = matchIdByNumber.get(m.match_number);
      if (!matchId) continue;

      const redSurrogates = new Set(m.alliances.red.surrogate_team_keys ?? []);
      const blueSurrogates = new Set(m.alliances.blue.surrogate_team_keys ?? []);

      for (let i = 0; i < 3; i++) {
        const redKey = m.alliances.red.team_keys[i];
        const blueKey = m.alliances.blue.team_keys[i];
        if (redKey) {
          const teamNumber = parseTbaTeamKey(redKey);
          teamNumbers.add(teamNumber);
          teamMatchRows.push({
            eventId: eventRow.id,
            matchId,
            teamNumber,
            alliance: "red",
            position: (i + 1) as 1 | 2 | 3,
            surrogate: redSurrogates.has(redKey),
          });
        }
        if (blueKey) {
          const teamNumber = parseTbaTeamKey(blueKey);
          teamNumbers.add(teamNumber);
          teamMatchRows.push({
            eventId: eventRow.id,
            matchId,
            teamNumber,
            alliance: "blue",
            position: (i + 1) as 1 | 2 | 3,
            surrogate: blueSurrogates.has(blueKey),
          });
        }
      }
    }

    // Insert teams that don't yet exist — don't overwrite names from prior enrichment.
    if (teamNumbers.size > 0) {
      await tx
        .insert(team)
        .values([...teamNumbers].map((n) => ({ teamNumber: n, teamName: "" })))
        .onConflictDoNothing();
    }

    if (teamMatchRows.length > 0) {
      await tx
        .insert(teamMatch)
        .values(teamMatchRows)
        .onConflictDoUpdate({
          target: [teamMatch.matchId, teamMatch.teamNumber],
          set: {
            alliance: sql`excluded.alliance`,
            position: sql`excluded.position`,
            surrogate: sql`excluded.surrogate`,
          },
        });
    }
  });

  revalidateTag(cacheTags.eventTeams(eventRow.id), "max");
  revalidateTag(cacheTags.teamMetrics(eventRow.id), "max");
  revalidateTag(cacheTags.matchScores(eventRow.id), "max");

  return { updated: true };
}
