"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import { event, match, team, teamMatch } from "@/lib/database/schema/tables";
import { routes } from "@/lib/routes";
import {
  getActiveEventForOrganization,
  setActiveEventForOrganization,
} from "@/lib/server/organization/active-event";
import { getTBAClient, parseTbaTeamKey } from "@/lib/server/tba";

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
    const [tbaEvent, tbaMatches, tbaTeams] = await Promise.all([
      tba.events.get(key),
      tba.matches.getEventMatches(key),
      tba.events.getTeamsSimple(key),
    ]);

    if (!tbaEvent) {
      return { data: null, error: "TBA event not found" };
    }

    if (!tbaMatches) {
      return { data: null, error: "TBA matches not found" };
    }

    const qualifyingMatches = tbaMatches.filter((m) => m.comp_level === "qm");

    const { eventId, matchCount, teamMatchCount } = await db.transaction(async (tx) => {
      const [upsertedEvent] = await tx
        .insert(event)
        .values({
          eventCode: tbaEvent.key,
          name: tbaEvent.name,
          startDate: new Date(tbaEvent.start_date),
          endDate: new Date(tbaEvent.end_date),
        })
        .onConflictDoUpdate({
          target: event.eventCode,
          set: {
            name: tbaEvent.name,
            startDate: new Date(tbaEvent.start_date),
            endDate: new Date(tbaEvent.end_date),
          },
        })
        .returning({ id: event.id });

      if (!upsertedEvent) {
        throw new Error("Failed to upsert event");
      }

      const eventId = upsertedEvent.id;

      if (qualifyingMatches.length > 0) {
        await tx
          .insert(match)
          .values(
            qualifyingMatches.map((m) => ({
              eventId,
              matchType: "qm" as const,
              matchNumber: m.match_number,
              redScore: m.alliances.red.score ?? null,
              blueScore: m.alliances.blue.score ?? null,
            }))
          )
          .onConflictDoUpdate({
            target: [match.eventId, match.matchNumber, match.matchType],
            set: {
              redScore: sql`excluded.red_score`,
              blueScore: sql`excluded.blue_score`,
            },
          });
      }

      const matchRows = await tx
        .select({ id: match.id, matchNumber: match.matchNumber, matchType: match.matchType })
        .from(match)
        .where(eq(match.eventId, eventId));
      const matchIdByKey = new Map(matchRows.map((r) => [`${r.matchNumber}:${r.matchType}`, r.id]));

      const teamMatchRows: Array<{
        eventId: string;
        matchId: string;
        teamNumber: number;
        alliance: "red" | "blue";
        position: 1 | 2 | 3;
        surrogate: boolean;
      }> = [];

      for (const m of qualifyingMatches) {
        const matchId = matchIdByKey.get(`${m.match_number}:qm`);
        if (!matchId) continue;

        const redSurrogates = new Set(m.alliances.red.surrogate_team_keys ?? []);
        const blueSurrogates = new Set(m.alliances.blue.surrogate_team_keys ?? []);

        for (let i = 0; i < 3; i++) {
          const redKey = m.alliances.red.team_keys[i];
          const blueKey = m.alliances.blue.team_keys[i];
          if (redKey) {
            teamMatchRows.push({
              eventId,
              matchId,
              teamNumber: parseTbaTeamKey(redKey),
              alliance: "red",
              position: (i + 1) as 1 | 2 | 3,
              surrogate: redSurrogates.has(redKey),
            });
          }
          if (blueKey) {
            teamMatchRows.push({
              eventId,
              matchId,
              teamNumber: parseTbaTeamKey(blueKey),
              alliance: "blue",
              position: (i + 1) as 1 | 2 | 3,
              surrogate: blueSurrogates.has(blueKey),
            });
          }
        }
      }

      const matchTeamNumbers = [...new Set(teamMatchRows.map((r) => r.teamNumber))];
      const tbaTeamMap = new Map(tbaTeams.map((t) => [t.team_number, t.nickname ?? t.name ?? ""]));
      const allTeamValues = matchTeamNumbers.map((n) => ({
        teamNumber: n,
        teamName: tbaTeamMap.get(n) ?? "",
      }));

      if (allTeamValues.length > 0) {
        await tx
          .insert(team)
          .values(allTeamValues)
          .onConflictDoUpdate({
            target: team.teamNumber,
            set: { teamName: sql`excluded.team_name` },
          });
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

      return {
        eventId,
        matchCount: qualifyingMatches.length,
        teamMatchCount: teamMatchRows.length,
      };
    });

    revalidatePath(routes.admin.event);
    revalidateTag(cacheTags.teamsList, "max");
    revalidateTag(cacheTags.eventTeams(eventId), "max");
    revalidateTag(cacheTags.eventMatchNumbers(eventId), "max");
    return {
      data: { success: true, eventId, matchCount, teamMatchCount },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to sync event from TBA",
    };
  }
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
