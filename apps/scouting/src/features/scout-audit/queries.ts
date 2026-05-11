import "server-only";

import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache";
import { db } from "@/lib/database";
import {
  climb,
  cycle,
  event,
  match,
  member,
  standForm,
  teamMatch,
  user,
} from "@/lib/database/schema/tables";
import type { MemberFormRow, MemberFormSummary, StandFormDetail } from "./types";
import { isFormFlagged } from "./utils";

export async function getMemberFormSummary(
  eventId: string,
  memberId: string,
  organizationId: string
): Promise<MemberFormSummary> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.memberFormSummary(eventId, memberId));

  const autoCycles = sql<number>`count(DISTINCT CASE WHEN ${cycle.phase} = 'auto' THEN ${cycle.id} END)::int`;
  const teleopCycles = sql<number>`count(DISTINCT CASE WHEN ${cycle.phase} = 'teleop' THEN ${cycle.id} END)::int`;

  const rows = await db
    .select({
      formId: standForm.id,
      oofTimeSeconds: standForm.oofTimeSeconds,
      commentsLength: sql<number>`length(${standForm.comments})::int`,
      autoCycles,
      teleopCycles,
    })
    .from(standForm)
    .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
    .innerJoin(
      member,
      and(eq(member.id, standForm.scoutMemberId), eq(member.organizationId, organizationId))
    )
    .leftJoin(cycle, eq(cycle.standFormId, standForm.id))
    .where(
      and(
        eq(teamMatch.eventId, eventId),
        eq(standForm.scoutMemberId, memberId),
        isNull(standForm.deletedAt)
      )
    )
    .groupBy(standForm.id, standForm.oofTimeSeconds, standForm.comments);

  if (rows.length === 0) {
    return { totalForms: 0, avgCyclesPerForm: 0, flaggedCount: 0 };
  }

  let totalCycles = 0;
  let flaggedCount = 0;
  for (const r of rows) {
    const cycleCount = (r.autoCycles ?? 0) + (r.teleopCycles ?? 0);
    totalCycles += cycleCount;
    if (
      isFormFlagged({
        oofTimeSeconds: r.oofTimeSeconds ?? 0,
        cycleCount,
        commentsLength: r.commentsLength ?? 0,
      })
    ) {
      flaggedCount++;
    }
  }

  return {
    totalForms: rows.length,
    avgCyclesPerForm: Math.round((totalCycles / rows.length) * 10) / 10,
    flaggedCount,
  };
}

export async function getMemberStandForms(
  eventId: string,
  memberId: string,
  organizationId: string
): Promise<MemberFormRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.memberStandForms(eventId, memberId));

  const autoCycles = sql<number>`count(DISTINCT CASE WHEN ${cycle.phase} = 'auto' THEN ${cycle.id} END)::int`;
  const teleopCycles = sql<number>`count(DISTINCT CASE WHEN ${cycle.phase} = 'teleop' THEN ${cycle.id} END)::int`;
  const climbCount = sql<number>`count(DISTINCT ${climb.id})::int`;

  const rows = await db
    .select({
      formId: standForm.id,
      matchType: match.matchType,
      matchNumber: match.matchNumber,
      teamNumber: teamMatch.teamNumber,
      alliance: teamMatch.alliance,
      position: teamMatch.position,
      oofTimeSeconds: standForm.oofTimeSeconds,
      comments: standForm.comments,
      createdAt: standForm.createdAt,
      autoCycles,
      teleopCycles,
      climbCount,
    })
    .from(standForm)
    .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
    .innerJoin(match, eq(match.id, teamMatch.matchId))
    .innerJoin(
      member,
      and(eq(member.id, standForm.scoutMemberId), eq(member.organizationId, organizationId))
    )
    .leftJoin(cycle, eq(cycle.standFormId, standForm.id))
    .leftJoin(climb, eq(climb.standFormId, standForm.id))
    .where(
      and(
        eq(teamMatch.eventId, eventId),
        eq(standForm.scoutMemberId, memberId),
        isNull(standForm.deletedAt)
      )
    )
    .groupBy(
      standForm.id,
      match.matchType,
      match.matchNumber,
      teamMatch.teamNumber,
      teamMatch.alliance,
      teamMatch.position,
      standForm.oofTimeSeconds,
      standForm.comments,
      standForm.createdAt
    )
    .orderBy(sql`${match.matchNumber} DESC`);

  return rows.map((r) => ({
    formId: r.formId,
    matchType: r.matchType,
    matchNumber: r.matchNumber,
    teamNumber: r.teamNumber,
    alliance: r.alliance,
    position: r.position,
    autoCycles: r.autoCycles ?? 0,
    teleopCycles: r.teleopCycles ?? 0,
    climbCount: r.climbCount ?? 0,
    oofTimeSeconds: r.oofTimeSeconds ?? 0,
    comments: r.comments ?? "",
    createdAt: r.createdAt,
  }));
}

export async function getStandFormForAudit(
  formId: string,
  organizationId: string
): Promise<StandFormDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.standFormAudit(formId));

  const formRow = await db
    .select({
      formId: standForm.id,
      matchType: match.matchType,
      matchNumber: match.matchNumber,
      teamNumber: teamMatch.teamNumber,
      alliance: teamMatch.alliance,
      position: teamMatch.position,
      eventName: event.name,
      comments: standForm.comments,
      canShuttle: standForm.canShuttle,
      oofTimeSeconds: standForm.oofTimeSeconds,
      memberId: member.id,
      scoutName: user.name,
      scoutImage: user.image,
      createdAt: standForm.createdAt,
    })
    .from(standForm)
    .innerJoin(teamMatch, eq(teamMatch.id, standForm.teamMatchId))
    .innerJoin(match, eq(match.id, teamMatch.matchId))
    .innerJoin(event, eq(event.id, teamMatch.eventId))
    .innerJoin(
      member,
      and(eq(member.id, standForm.scoutMemberId), eq(member.organizationId, organizationId))
    )
    .leftJoin(user, eq(user.id, member.userId))
    .where(and(eq(standForm.id, formId), isNull(standForm.deletedAt)))
    .limit(1);

  if (formRow.length === 0 || !formRow[0]) return null;
  const form = formRow[0];

  const [cycles, climbs] = await Promise.all([
    db
      .select({
        cycleNumber: cycle.cycleNumber,
        phase: cycle.phase,
        dumpDuration: cycle.dumpDuration,
      })
      .from(cycle)
      .where(eq(cycle.standFormId, formId))
      .orderBy(cycle.phase, asc(cycle.cycleNumber)),

    db
      .select({
        climbPhase: climb.climbPhase,
        climbDuration: climb.climbDuration,
        createdAt: climb.createdAt,
      })
      .from(climb)
      .where(eq(climb.standFormId, formId))
      .orderBy(asc(climb.createdAt)),
  ]);

  return {
    formId: form.formId,
    matchType: form.matchType,
    matchNumber: form.matchNumber,
    teamNumber: form.teamNumber,
    alliance: form.alliance,
    position: form.position,
    eventName: form.eventName,
    comments: form.comments,
    canShuttle: form.canShuttle,
    oofTimeSeconds: form.oofTimeSeconds ?? 0,
    memberId: form.memberId,
    scoutName: form.scoutName ?? null,
    scoutImage: form.scoutImage ?? null,
    createdAt: form.createdAt,
    cycles: cycles.map((c) => ({
      cycleNumber: c.cycleNumber,
      phase: c.phase as "auto" | "teleop",
      dumpDuration: Number(c.dumpDuration),
    })),
    climbs: climbs.map((c, i) => ({
      index: i + 1,
      climbPhase: c.climbPhase as "auto" | "teleop",
      climbDuration: Number(c.climbDuration),
    })),
  };
}
