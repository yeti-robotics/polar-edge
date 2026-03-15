import "server-only";

import { and, countDistinct, desc, eq, isNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  account,
  autoPath,
  member,
  pitForm,
  standForm,
  teamMatch,
  user,
} from "@/lib/database/schema/tables";
import { resolveLeaderboardDisplayNames } from "./display-names";

export type MemberCount = {
  memberId: string;
  userName: string;
  userImage: string | null;
  role: string;
  count: number;
};

type MemberCountRow = MemberCount & {
  discordUserId: string | null;
};

export async function getStandFormCounts(
  organizationId: string,
  eventId: string | null
): Promise<MemberCount[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.leaderboardStand(organizationId));

  const rows: MemberCountRow[] = await db
    .select({
      memberId: member.id,
      userName: user.name,
      userImage: user.image,
      role: member.role,
      count: countDistinct(standForm.id),
      discordUserId: account.accountId,
    })
    .from(standForm)
    .innerJoin(member, eq(standForm.scoutMemberId, member.id))
    .innerJoin(user, eq(member.userId, user.id))
    .leftJoin(account, and(eq(account.userId, user.id), eq(account.providerId, "discord")))
    .innerJoin(teamMatch, eq(standForm.teamMatchId, teamMatch.id))
    .where(
      and(
        isNull(standForm.deletedAt),
        eq(member.organizationId, organizationId),
        eventId ? eq(teamMatch.eventId, eventId) : undefined
      )
    )
    .groupBy(member.id, member.role, user.id, user.name, user.image, account.accountId)
    .orderBy(desc(countDistinct(standForm.id)));

  return resolveLeaderboardDisplayNames(rows);
}

export async function getPitFormCounts(organizationId: string): Promise<MemberCount[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.leaderboardPit(organizationId));

  const rows: MemberCountRow[] = await db
    .select({
      memberId: member.id,
      userName: user.name,
      userImage: user.image,
      role: member.role,
      count: countDistinct(pitForm.id),
      discordUserId: account.accountId,
    })
    .from(pitForm)
    .innerJoin(member, eq(pitForm.scoutMemberId, member.id))
    .innerJoin(user, eq(member.userId, user.id))
    .leftJoin(account, and(eq(account.userId, user.id), eq(account.providerId, "discord")))
    .where(eq(member.organizationId, organizationId))
    .groupBy(member.id, member.role, user.id, user.name, user.image, account.accountId)
    .orderBy(desc(countDistinct(pitForm.id)));

  return resolveLeaderboardDisplayNames(rows);
}

export async function getAutoPathCounts(organizationId: string): Promise<MemberCount[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.leaderboardAuto(organizationId));

  const rows: MemberCountRow[] = await db
    .select({
      memberId: member.id,
      userName: user.name,
      userImage: user.image,
      role: member.role,
      count: countDistinct(autoPath.id),
      discordUserId: account.accountId,
    })
    .from(autoPath)
    .innerJoin(member, eq(autoPath.createdByMemberId, member.id))
    .innerJoin(user, eq(member.userId, user.id))
    .leftJoin(account, and(eq(account.userId, user.id), eq(account.providerId, "discord")))
    .where(eq(member.organizationId, organizationId))
    .groupBy(member.id, member.role, user.id, user.name, user.image, account.accountId)
    .orderBy(desc(countDistinct(autoPath.id)));

  return resolveLeaderboardDisplayNames(rows);
}
