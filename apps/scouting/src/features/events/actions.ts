"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  match,
  tbaMatchBreakdown,
  team,
  teamEventCopr,
  teamMatch,
} from "@/lib/database/schema/tables";
import { routes } from "@/lib/routes";
import {
  getActiveEventForOrganization,
  setActiveEventForOrganization,
} from "@/lib/server/organization/active-event";
import { getTBAClient, parseTbaTeamKey } from "@/lib/server/tba";
import { manualEventSchema } from "./manual-import-schema";
import { importMatchSchedule } from "./match-schedule/import";
import { csvScheduleToImport } from "./match-schedule/sources/csv";
import { tbaScheduleToImport } from "./match-schedule/sources/tba";

export async function setActiveEventAction(organizationId: string, eventId: string) {
  try {
    const requestHeaders = await headers();
    const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

    if (!activeMember || activeMember.organizationId !== organizationId) {
      return { data: null, error: "Only organization admins and owners can set the active event" };
    }

    const { success: canActivate } = await auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { event: ["activate"] } },
    });
    if (!canActivate) {
      return { data: null, error: "Only organization admins and owners can set the active event" };
    }

    await setActiveEventForOrganization(organizationId, eventId);
    revalidatePath(routes.admin.event);
    return { data: { success: true }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to set active event",
    };
  }
}

export async function syncEventFromTBAAction(organizationId: string, tbaEventKey: string) {
  try {
    const requestHeaders = await headers();
    const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

    if (!activeMember || activeMember.organizationId !== organizationId) {
      return {
        data: null,
        error: "Only organization admins and owners can sync events from TBA",
      };
    }

    const { success: canSync } = await auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { event: ["sync"] } },
    });
    if (!canSync) {
      return {
        data: null,
        error: "Only organization admins and owners can sync events from TBA",
      };
    }

    const key = tbaEventKey.trim();
    if (!key) {
      return { data: null, error: "TBA event key is required (e.g. 2026ncwak)" };
    }

    const tba = getTBAClient();
    const [tbaEvent, tbaMatches, tbaTeams, tbaCoprs] = await Promise.all([
      tba.events.get(key),
      tba.matches.getEventMatches(key),
      tba.events.getTeamsSimple(key),
      tba.events.getCOPRs(key).catch(() => null),
    ]);

    if (!tbaEvent) {
      return { data: null, error: "TBA event not found" };
    }

    if (!tbaMatches) {
      return { data: null, error: "TBA matches not found" };
    }

    const schedule = tbaScheduleToImport(tbaEvent, tbaMatches, tbaTeams);
    const result = await importMatchSchedule(schedule);
    const qualifyingMatches = tbaMatches.filter((tbaMatch) => tbaMatch.comp_level === "qm");
    const matchTeamNumbers = [
      ...new Set(schedule.matches.flatMap(({ slots }) => slots.map(({ teamNumber }) => teamNumber))),
    ];

    await db.transaction(async (tx) => {
      const matchRows = await tx
        .select({ id: match.id, matchNumber: match.matchNumber, matchType: match.matchType })
        .from(match)
        .where(eq(match.eventId, result.eventId));
      const matchIdByKey = new Map(matchRows.map((r) => [`${r.matchNumber}:${r.matchType}`, r.id]));

      // Upsert TBA score breakdown climb 
      const breakdownRows = extractClimbBreakdowns(qualifyingMatches, matchIdByKey);
      if (breakdownRows.length > 0) {
       
        const tmRows = await tx
          .select({
            id: teamMatch.id,
            matchId: teamMatch.matchId,
            teamNumber: teamMatch.teamNumber,
          })
          .from(teamMatch)
          .where(eq(teamMatch.eventId, result.eventId));
        const tmIdByKey = new Map(tmRows.map((r) => [`${r.matchId}:${r.teamNumber}`, r.id]));

        const breakdownValues = breakdownRows
          .map((r) => {
            const tmId = tmIdByKey.get(`${r.matchId}:${r.teamNumber}`);
            if (!tmId) return null;
            return {
              teamMatchId: tmId,
              autoClimbLevel: r.autoClimbLevel,
              endgameClimbLevel: r.endgameClimbLevel,
            };
          })
          .filter((r) => r != null);

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
      }

      // Upsert COPR fuel counts if available
      if (tbaCoprs) {
        const autoFuel = tbaCoprs["Hub Auto Fuel Count"];
        const teleopFuel = tbaCoprs["Hub Teleop Fuel Count"];
        const endgameFuel = tbaCoprs["Hub Endgame Fuel Count"];
        const totalFuel = tbaCoprs["Hub Total Fuel Count"];

        if (autoFuel && totalFuel) {
          const coprRows = Object.keys(totalFuel)
            .map((tbaKey) => {
              const teamNumber = parseTbaTeamKey(tbaKey);
              return {
                eventId: result.eventId,
                teamNumber,
                autoFuelCount: String(autoFuel[tbaKey] ?? 0),
                teleopFuelCount: String(teleopFuel?.[tbaKey] ?? 0),
                endgameFuelCount: String(endgameFuel?.[tbaKey] ?? 0),
                totalFuelCount: String(totalFuel[tbaKey] ?? 0),
              };
            })
            .filter((r) => matchTeamNumbers.includes(r.teamNumber));

          if (coprRows.length > 0) {
            await tx
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
    });

    revalidateTag(cacheTags.eventCoprs(result.eventId), "max");
    revalidateTag(cacheTags.teamMetrics(result.eventId), "max");
    return {
      data: { success: true, ...result },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to sync event from TBA",
    };
  }
}

export async function createManualEventAction(
  organizationId: string,
  eventInput: unknown,
  csvText: string
) {
  try {
    const requestHeaders = await headers();
    const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

    if (!activeMember || activeMember.organizationId !== organizationId) {
      return {
        data: null,
        error: "Only organization admins and owners can create manual events",
      };
    }

    const { success: canSync } = await auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { event: ["sync"] } },
    });

    if (!canSync) {
      return {
        data: null,
        error: "Only organization admins and owners can create manual events",
      };
    }

    const eventResult = manualEventSchema.safeParse(eventInput);
    if (!eventResult.success) {
      return {
        data: null,
        error: eventResult.error.issues[0]?.message ?? "Invalid event information",
      };
    }

    const schedule = csvScheduleToImport(
      {
        mode: "create-or-update",
        eventCode: eventResult.data.eventCode,
        name: eventResult.data.name,
        startDate: eventResult.data.startDate,
        endDate: eventResult.data.endDate,
      },
      csvText
    );
    const result = await importMatchSchedule(schedule);

    return { data: { success: true, ...result }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create manual event",
    };
  }
}


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

type ClimbBreakdownRow = {
  matchId: string;
  teamNumber: number;
  autoClimbLevel: number;
  endgameClimbLevel: number;
};

function extractClimbBreakdowns(
  matches: Array<{
    match_number: number;
    year: number;
    score_breakdown: unknown;
    alliances: { red: { team_keys: string[] }; blue: { team_keys: string[] } };
  }>,
  matchIdByKey: Map<string, string>
): ClimbBreakdownRow[] {
  const rows: ClimbBreakdownRow[] = [];

  for (const m of matches) {
    if (m.year !== 2026 || !m.score_breakdown) continue;
    const matchId = matchIdByKey.get(`${m.match_number}:qm`);
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

        rows.push({
          matchId,
          teamNumber: parseTbaTeamKey(teamKey),
          autoClimbLevel: parseTowerLevel(allianceBreakdown[`autoTowerRobot${pos}`]),
          endgameClimbLevel: parseTowerLevel(allianceBreakdown[`endGameTowerRobot${pos}`]),
        });
      }
    }
  }

  return rows;
}

export async function enrichTeamNamesAction(organizationId: string) {
  try {
    const requestHeaders = await headers();
    const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

    if (!activeMember || activeMember.organizationId !== organizationId) {
      return { data: null, error: "Unauthorized" };
    }

    const { success: canSync } = await auth.api.hasPermission({
      headers: requestHeaders,
      body: { permissions: { event: ["sync"] } },
    });
    if (!canSync) {
      return { data: null, error: "Only organization admins and owners can enrich team names" };
    }

    const unnamedTeams = await db
      .select({ teamNumber: team.teamNumber })
      .from(team)
      .where(eq(team.teamName, ""));

    if (unnamedTeams.length === 0) {
      return { data: { enrichedCount: 0 }, error: null };
    }

    const tba = getTBAClient();
    const results = await Promise.allSettled(
      unnamedTeams.map((t) => tba.teams.getSimple(t.teamNumber))
    );

    const enriched: Array<{ teamNumber: number; teamName: string }> = [];
    for (const [i, result] of results.entries()) {
      if (result.status !== "fulfilled") continue;
      const teamData = result.value;
      if (!teamData) continue;
      const name = teamData.nickname ?? teamData.name ?? "";
      if (name) {
        const unnamedTeam = unnamedTeams[i];
        if (unnamedTeam) enriched.push({ teamNumber: unnamedTeam.teamNumber, teamName: name });
      }
    }

    if (enriched.length > 0) {
      await db
        .insert(team)
        .values(enriched)
        .onConflictDoUpdate({
          target: team.teamNumber,
          set: { teamName: sql`excluded.team_name` },
        });
    }

    revalidateTag(cacheTags.teamsList, "max");
    const activeEvent = await getActiveEventForOrganization(organizationId);
    if (activeEvent) {
      revalidateTag(cacheTags.eventTeams(activeEvent.eventId), "max");
    }
    return { data: { enrichedCount: enriched.length }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to enrich team names",
    };
  }
}
