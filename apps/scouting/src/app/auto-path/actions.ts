"use server";

import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { z } from "zod";
import type { PathData } from "@/components/auto-path/PathCanvas";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { autoPath, event, match, team } from "@/lib/database/schema";

const createAutoPathSchema = z.object({
  teamNumber: z.number().int().positive(),
  name: z.string().min(1).max(255),
  matchId: z.string().min(1).max(32),
  pathData: z.object({
    points: z.array(
      z.object({
        x: z.number(),
        y: z.number(),
        timestamp: z.number(),
      })
    ),
  }),
  hasL1Climb: z.boolean(),
  fieldImageUrl: z.string().nullable().optional(),
});

export async function createAutoPath(data: z.infer<typeof createAutoPathSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const activeMember = await auth.api.getActiveMember({ headers: await headers() });
  const activeOrganization = activeMember?.organizationId;
  if (!activeOrganization) {
    throw new Error("No active organization");
  }

  const validated = createAutoPathSchema.parse(data);

  // Verify team exists
  const teamExists = await db
    .select()
    .from(team)
    .where(eq(team.teamNumber, validated.teamNumber))
    .limit(1);

  if (teamExists.length === 0) {
    throw new Error("Team not found");
  }

  // Verify match exists
  const matchExists = await db.select().from(match).where(eq(match.id, validated.matchId)).limit(1);

  if (matchExists.length === 0) {
    throw new Error("Match not found");
  }

  const id = nanoid();

  if (!activeMember) {
    throw new Error("No active member");
  }

  await db.insert(autoPath).values({
    id,
    name: validated.name,
    teamNumber: validated.teamNumber,
    pathData: validated.pathData as unknown as Record<string, unknown>,
    hasL1Climb: validated.hasL1Climb,
    fieldImageUrl: validated.fieldImageUrl ?? null,
    createdByMemberId: activeMember.id,
  });

  return { id };
}

export async function getAutoPaths(filters?: {
  teamNumber?: number;
  matchId?: string;
  organizationId?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const activeMember = await auth.api.getActiveMember({ headers: await headers() });
  const activeOrganization = activeMember?.organizationId;
  if (!activeOrganization) {
    throw new Error("No active organization");
  }

  const conditions = [];

  if (filters?.teamNumber) {
    conditions.push(eq(autoPath.teamNumber, filters.teamNumber));
  }

  const paths = await db
    .select()
    .from(autoPath)
    .where(and(...conditions))
    .orderBy(desc(autoPath.createdAt));

  return paths.map((path) => ({
    ...path,
    pathData: path.pathData as unknown as PathData,
  }));
}

export async function getAutoPath(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const activeMember = await auth.api.getActiveMember({ headers: await headers() });
  const activeOrganization = activeMember?.organizationId;
  if (!activeOrganization) {
    throw new Error("No active organization");
  }

  const paths = await db
    .select()
    .from(autoPath)
    .where(eq(autoPath.id, id))
    .limit(1);

  const path = paths[0];
  if (!path) {
    throw new Error("Auto path not found");
  }

  return {
    ...path,
    pathData: path.pathData as unknown as PathData,
  };
}

export async function updateAutoPath(
  id: string,
  data: Partial<z.infer<typeof createAutoPathSchema>>
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const activeMember = await auth.api.getActiveMember({ headers: await headers() });
  const activeOrganization = activeMember?.organizationId;
  if (!activeOrganization) {
    throw new Error("No active organization");
  }

  // Verify ownership
  const existing = await db
    .select()
    .from(autoPath)
    .where(eq(autoPath.id, id))
    .limit(1);

  if (existing.length === 0 || !existing[0]) {
    throw new Error("Auto path not found");
  }

  const updateData: Partial<typeof autoPath.$inferInsert> = {};

  if (data.teamNumber !== undefined) {
    updateData.teamNumber = data.teamNumber;
  }
  if (data.pathData !== undefined) {
    updateData.pathData = data.pathData as unknown as Record<string, unknown>;
  }
  if (data.hasL1Climb !== undefined) {
    updateData.hasL1Climb = data.hasL1Climb;
  }
  if (data.fieldImageUrl !== undefined) {
    updateData.fieldImageUrl = data.fieldImageUrl ?? null;
  }

  await db.update(autoPath).set(updateData).where(eq(autoPath.id, id));

  return { id };
}

export async function deleteAutoPath(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const activeMember = await auth.api.getActiveMember({ headers: await headers() });
  const activeOrganization = activeMember?.organizationId;
  if (!activeOrganization) {
    throw new Error("No active organization");
  }

  await db.delete(autoPath).where(eq(autoPath.id, id));

  return { id };
}

// Helper functions for fetching teams and matches
export async function getTeams() {
  const teams = await db.select().from(team).orderBy(team.teamNumber);
  return teams;
}

export async function getMatches(eventCode?: string) {
  if (eventCode) {
    const matches = await db
      .select({
        id: match.id,
        eventId: match.eventId,
        matchType: match.matchType,
        matchNumber: match.matchNumber,
        redScore: match.redScore,
        blueScore: match.blueScore,
      })
      .from(match)
      .innerJoin(event, eq(match.eventId, event.id))
      .where(eq(event.eventCode, eventCode))
      .orderBy(match.matchNumber);

    return matches;
  }

  const matches = await db
    .select()
    .from(match)
    .orderBy(match.matchNumber);

  return matches;
}
