"use server";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {  team } from "@/lib/database/schema/tables";
import { routes } from "@/lib/routes";
import {
  getActiveEventForOrganization,
  setActiveEventForOrganization,
} from "@/lib/server/organization/active-event";
import { getTBAClient  } from "@/lib/server/tba";
import {  manualEventSchema } from "./manual-import-schema";
import { csvScheduleToImport } from "./match-schedule/sources/csv";
import { importMatchSchedule } from "./match-schedule/import";
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

    const schedule = tbaScheduleToImport(
      tbaEvent,
      tbaMatches,
      tbaTeams,
    );

    const result = await importMatchSchedule(schedule);

    return {
      data: {
        success: true,
        ...result,
      },
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
  csvText: string,
) {
  try {
    const requestHeaders = await headers();

    const activeMember = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (
      !activeMember ||
      activeMember.organizationId !== organizationId
    ) {
      return {
        data: null,
        error:
          "Only organization admins and owners can create manual events",
      };
    }

    const { success: canSync } = await auth.api.hasPermission({
      headers: requestHeaders,
      body: {
        permissions: {
          event: ["sync"],
        },
      },
    });

    if (!canSync) {
      return {
        data: null,
        error:
          "Only organization admins and owners can create manual events",
      };
    }

    const eventResult = manualEventSchema.safeParse(eventInput);

    if (!eventResult.success) {
      return {
        data: null,
        error:
          eventResult.error.issues[0]?.message ??
          "Invalid event information",
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
      csvText,
    );

    const result = await importMatchSchedule(schedule);

    return {
      data: {
        success: true,
        ...result,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create manual event",
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
