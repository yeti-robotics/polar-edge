import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/database";
import { autoPath, event, match, member, team } from "@/lib/database/schema";
import type { PathData } from "./components/PathCanvas";

export const createAutoPathSchema = z.object({
  teamNumber: z.number().int().positive(),
  name: z.string().min(1).max(255),
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

export async function insertAutoPath(data: z.infer<typeof createAutoPathSchema>, memberId: string) {
  const validated = createAutoPathSchema.parse(data);

  const teamExists = await db
    .select()
    .from(team)
    .where(eq(team.teamNumber, validated.teamNumber))
    .limit(1);

  if (teamExists.length === 0) {
    throw new Error("Team not found");
  }

  const id = nanoid();

  await db.insert(autoPath).values({
    id,
    name: validated.name,
    teamNumber: validated.teamNumber,
    pathData: validated.pathData as unknown as Record<string, unknown>,
    hasL1Climb: validated.hasL1Climb,
    fieldImageUrl: validated.fieldImageUrl ?? null,
    createdByMemberId: memberId,
  });

  return { id };
}

export async function queryAutoPaths(organizationId: string, filters?: { teamNumber?: number }) {
  const conditions = [eq(member.organizationId, organizationId)];

  if (filters?.teamNumber) {
    conditions.push(eq(autoPath.teamNumber, filters.teamNumber));
  }

  const rows = await db
    .select({ autoPath })
    .from(autoPath)
    .innerJoin(member, eq(autoPath.createdByMemberId, member.id))
    .where(and(...conditions))
    .orderBy(desc(autoPath.createdAt));

  return rows.map(({ autoPath: path }) => ({
    ...path,
    pathData: path.pathData as unknown as PathData,
  }));
}

export async function queryAutoPath(id: string, organizationId: string) {
  const rows = await db
    .select({ autoPath })
    .from(autoPath)
    .innerJoin(member, eq(autoPath.createdByMemberId, member.id))
    .where(and(eq(autoPath.id, id), eq(member.organizationId, organizationId)))
    .limit(1);

  const path = rows[0]?.autoPath;
  if (!path) {
    throw new Error("Auto path not found or unauthorized");
  }

  return {
    ...path,
    pathData: path.pathData as unknown as PathData,
  };
}

export async function modifyAutoPath(
  id: string,
  data: Partial<z.infer<typeof createAutoPathSchema>>,
  organizationId: string
) {
  const existingRows = await db
    .select({ autoPath })
    .from(autoPath)
    .innerJoin(member, eq(autoPath.createdByMemberId, member.id))
    .where(and(eq(autoPath.id, id), eq(member.organizationId, organizationId)))
    .limit(1);

  if (existingRows.length === 0 || !existingRows[0]) {
    throw new Error("Auto path not found or unauthorized");
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

export async function removeAutoPath(id: string, organizationId: string) {
  const existing = await db
    .select({ id: autoPath.id })
    .from(autoPath)
    .innerJoin(member, eq(autoPath.createdByMemberId, member.id))
    .where(and(eq(autoPath.id, id), eq(member.organizationId, organizationId)))
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Auto path not found or unauthorized");
  }

  await db.delete(autoPath).where(eq(autoPath.id, id));

  return { id };
}

export async function queryTeams() {
  const teams = await db.select().from(team).orderBy(team.teamNumber);
  return teams;
}

export async function queryMatches(eventCode?: string) {
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

  const matches = await db.select().from(match).orderBy(match.matchNumber);
  return matches;
}
