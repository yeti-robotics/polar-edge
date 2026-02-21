import "server-only";

import { and, countDistinct, desc, eq, isNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { db } from "@/lib/database";
import {
  autoPath,
  member,
  pitForm,
  standForm,
  teamMatch,
  user,
} from "@/lib/database/schema/tables";

export type MemberCount = {
  memberId: string;
  userName: string;
  userImage: string | null;
  role: string;
  count: number;
};

export async function getStandFormCounts(
  organizationId: string,
  eventId: string | null
): Promise<MemberCount[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.leaderboardStand(organizationId));

  return db
    .select({
      memberId: member.id,
      userName: user.name,
      userImage: user.image,
      role: member.role,
      count: countDistinct(standForm.id),
    })
    .from(standForm)
    .innerJoin(member, eq(standForm.scoutMemberId, member.id))
    .innerJoin(user, eq(member.userId, user.id))
    .innerJoin(teamMatch, eq(standForm.teamMatchId, teamMatch.id))
    .where(
      and(
        isNull(standForm.deletedAt),
        eq(member.organizationId, organizationId),
        eventId ? eq(teamMatch.eventId, eventId) : undefined
      )
    )
    .groupBy(member.id, member.role, user.id, user.name, user.image)
    .orderBy(desc(countDistinct(standForm.id)));
}

export async function getPitFormCounts(organizationId: string): Promise<MemberCount[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.leaderboardPit(organizationId));

  return db
    .select({
      memberId: member.id,
      userName: user.name,
      userImage: user.image,
      role: member.role,
      count: countDistinct(pitForm.id),
    })
    .from(pitForm)
    .innerJoin(member, eq(pitForm.scoutMemberId, member.id))
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, organizationId))
    .groupBy(member.id, member.role, user.id, user.name, user.image)
    .orderBy(desc(countDistinct(pitForm.id)));
}

export async function getAutoPathCounts(organizationId: string): Promise<MemberCount[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.leaderboardAuto(organizationId));

  return db
    .select({
      memberId: member.id,
      userName: user.name,
      userImage: user.image,
      role: member.role,
      count: countDistinct(autoPath.id),
    })
    .from(autoPath)
    .innerJoin(member, eq(autoPath.createdByMemberId, member.id))
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, organizationId))
    .groupBy(member.id, member.role, user.id, user.name, user.image)
    .orderBy(desc(countDistinct(autoPath.id)));
}
