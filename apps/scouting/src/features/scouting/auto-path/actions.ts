"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache";
import {
  createAutoPathSchema,
  insertAutoPath,
  modifyAutoPath,
  queryAutoPath,
  queryAutoPaths,
  queryMatches,
  queryTeams,
  removeAutoPath,
} from "./logic";

async function requireActiveMemberWithOrg() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const activeMember = await auth.api.getActiveMember({ headers: await headers() });
  if (!activeMember?.organizationId) {
    throw new Error("No active organization");
  }

  return activeMember;
}

export async function createAutoPath(data: z.infer<typeof createAutoPathSchema>) {
  const activeMember = await requireActiveMemberWithOrg();
  const result = await insertAutoPath(data, activeMember.id);
  revalidateTag(cacheTags.leaderboardAuto(activeMember.organizationId), "hours");
  return result;
}

export async function getAutoPaths(filters?: {
  teamNumber?: number;
  matchId?: string;
  organizationId?: string;
}) {
  const activeMember = await requireActiveMemberWithOrg();
  return queryAutoPaths(activeMember.organizationId, filters);
}

export async function getAutoPath(id: string) {
  const activeMember = await requireActiveMemberWithOrg();
  return queryAutoPath(id, activeMember.organizationId);
}

export async function updateAutoPath(
  id: string,
  data: Partial<z.infer<typeof createAutoPathSchema>>
) {
  const activeMember = await requireActiveMemberWithOrg();
  const result = await modifyAutoPath(id, data, activeMember.organizationId);
  revalidateTag(cacheTags.leaderboardAuto(activeMember.organizationId), "hours");
  return result;
}

export async function deleteAutoPath(id: string) {
  const activeMember = await requireActiveMemberWithOrg();
  const result = await removeAutoPath(id, activeMember.organizationId);
  revalidateTag(cacheTags.leaderboardAuto(activeMember.organizationId), "hours");
  return result;
}

export async function getTeams() {
  await requireActiveMemberWithOrg();
  return queryTeams();
}

export async function getMatches(eventCode?: string) {
  await requireActiveMemberWithOrg();
  return queryMatches(eventCode);
}
