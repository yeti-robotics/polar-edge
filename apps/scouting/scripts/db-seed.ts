import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  SimulatedDriveRanking,
  SimulatedMatchResult,
  SimulatedTeamMatch,
  TeamProfile,
} from "@repo/seed";
import {
  buildSchedule,
  gameConfig,
  generateTeamProfiles,
  planDistrict,
  simulateDriveRankings,
  simulateMatch,
  simulatePitForm,
  simulateTeamMatch,
} from "@repo/seed";
import dotenv from "dotenv";
import { reset } from "drizzle-seed";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const teamFilePath = path.resolve(__dirname, "teams.json");

dotenv.config({ path: path.join(appRoot, ".env.local") });
dotenv.config({ path: path.join(appRoot, ".env") });

// ── Helpers ──────────────────────────────────────────────────────

type DB = Awaited<typeof import("@/lib/database")>["db"];

async function batchInsert<T>(
  database: DB,
  table: Parameters<DB["insert"]>[0],
  values: T[],
  batchSize = 1000
): Promise<void> {
  if (values.length === 0) return;
  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    await (database.insert(table) as ReturnType<DB["insert"]>).values(batch);
  }
}

function uid(): string {
  return randomBytes(16).toString("hex");
}

async function readTeamNames(): Promise<string[]> {
  const contents = await readFile(teamFilePath, "utf-8");
  const parsed = JSON.parse(contents) as Record<string, { name: string }>;
  return Object.values(parsed).map((item) => item.name);
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  const { db } = await import("@/lib/database");
  const schemaTables = await import("../src/lib/database/schema/tables");
  const { eq, inArray } = await import("drizzle-orm");

  console.log("Resetting database...");
  await reset(db, schemaTables);

  // ── 1. Organization + members ────────────────────────────────

  console.log("Creating organization and members...");

  const orgId = uid();
  const ownerId = uid();
  const ownerMemberId = uid();

  await db.insert(schemaTables.organization).values({
    id: orgId,
    name: "Seed Organization",
    slug: "seed-org",
    createdAt: new Date(),
  });

  await db.insert(schemaTables.user).values({
    id: ownerId,
    name: "Seed Admin",
    email: "seed@polar-edge.dev",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(schemaTables.member).values({
    id: ownerMemberId,
    organizationId: orgId,
    userId: ownerId,
    role: "owner",
    createdAt: new Date(),
  });

  const scoutNames = [
    "Turbo McSenderson",
    "Wrench Monkey",
    "Bumper McBumperface",
    "Loctite Larry",
    "Zip Tie Zoe",
    "CAD Gremlin",
    "Gusset Gus",
    "Battery Beth",
  ];

  const scoutMembers: { id: string; role: string }[] = [];
  for (let i = 0; i < scoutNames.length; i++) {
    const userId = uid();
    const memberId = uid();
    const role = i < 2 ? "scout_lead" : "member";

    await db.insert(schemaTables.user).values({
      id: userId,
      name: scoutNames[i] ?? `Scout ${i + 1}`,
      email: `scout${i + 1}@polar-edge.dev`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(schemaTables.member).values({
      id: memberId,
      organizationId: orgId,
      userId,
      role,
      createdAt: new Date(),
    });

    scoutMembers.push({ id: memberId, role });
  }

  const allMemberIds = [ownerMemberId, ...scoutMembers.map((m) => m.id)];
  const scoutLeadIds = scoutMembers.filter((m) => m.role === "scout_lead").map((m) => m.id);

  const randomMemberId = () =>
    allMemberIds[Math.floor(Math.random() * allMemberIds.length)] ?? ownerMemberId;
  const randomScoutLeadId = () =>
    scoutLeadIds[Math.floor(Math.random() * scoutLeadIds.length)] ?? ownerMemberId;

  // ── 2. Teams ─────────────────────────────────────────────────

  console.log("Seeding teams...");

  const teamNames = await readTeamNames();
  const shuffledNames = [...teamNames]
    .sort(() => Math.random() - 0.5)
    .slice(0, gameConfig.teamCount);

  const teamNumbers: number[] = [];
  const usedNumbers = new Set<number>();
  while (teamNumbers.length < gameConfig.teamCount) {
    const num = Math.floor(Math.random() * 11500) + 1;
    if (!usedNumbers.has(num)) {
      usedNumbers.add(num);
      teamNumbers.push(num);
    }
  }

  await batchInsert(
    db,
    schemaTables.team,
    teamNumbers.map((teamNumber, i) => ({
      teamNumber,
      teamName: shuffledNames[i] ?? `Team ${teamNumber}`,
    }))
  );

  // ── 3. Team profiles ─────────────────────────────────────────

  const profiles = generateTeamProfiles(teamNumbers);
  const profileMap = new Map<number, TeamProfile>(profiles.map((p) => [p.teamNumber, p]));

  // ── 4. Plan district + create events ─────────────────────────

  console.log("Planning district season...");
  const plannedEvents = planDistrict(profiles);

  const eventRows = plannedEvents.map((pe, i) => {
    const startDate = new Date(2026, 2 + Math.floor(i / 3), 1 + (i % 3) * 10);
    const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    return { eventCode: pe.eventCode, name: pe.name, startDate, endDate };
  });

  await batchInsert(db, schemaTables.event, eventRows);

  const dbEvents = await db
    .select({ id: schemaTables.event.id, eventCode: schemaTables.event.eventCode })
    .from(schemaTables.event);

  const eventIdByCode = new Map(dbEvents.map((e) => [e.eventCode, e.id]));

  // Link org to all events, first is active
  await batchInsert(
    db,
    schemaTables.organizationEvent,
    dbEvents.map((e, i) => ({
      organizationId: orgId,
      eventId: e.id,
      isActive: i === 0,
    }))
  );

  // ── 5. Simulate each event ───────────────────────────────────

  let totalMatches = 0;
  let totalStandForms = 0;
  let totalCycles = 0;
  let totalClimbs = 0;
  let totalDriveRankings = 0;

  for (const planned of plannedEvents) {
    const eventId = eventIdByCode.get(planned.eventCode);
    if (!eventId) continue;

    const schedule = buildSchedule(planned.teamNumbers, planned.matchesPerTeam);

    // Simulate
    const simResults: SimulatedMatchResult[] = [];
    const simDriveRankings: SimulatedDriveRanking[] = [];

    for (const match of schedule) {
      simResults.push(simulateMatch(match, profileMap));
      simDriveRankings.push(...simulateDriveRankings(match, profileMap));
    }

    // Insert matches
    await batchInsert(
      db,
      schemaTables.match,
      simResults.map((r) => ({
        eventId,
        matchType: r.matchType as "qm",
        matchNumber: r.matchNumber,
        redScore: r.redScore,
        blueScore: r.blueScore,
      }))
    );

    const matchRows = await db
      .select({ id: schemaTables.match.id, matchNumber: schemaTables.match.matchNumber })
      .from(schemaTables.match)
      .where(eq(schemaTables.match.eventId, eventId));

    const matchIdByNumber = new Map(matchRows.map((m) => [m.matchNumber, m.id]));

    // Insert team matches
    const teamMatchInserts: {
      eventId: string;
      matchId: string;
      teamNumber: number;
      alliance: "red" | "blue";
      position: number;
    }[] = [];

    for (const result of simResults) {
      const matchId = matchIdByNumber.get(result.matchNumber);
      if (!matchId) continue;

      for (const t of result.redTeams) {
        const idx = result.redTeams.indexOf(t);
        teamMatchInserts.push({
          eventId,
          matchId,
          teamNumber: t.teamNumber,
          alliance: "red",
          position: idx + 1,
        });
      }
      for (const t of result.blueTeams) {
        const idx = result.blueTeams.indexOf(t);
        teamMatchInserts.push({
          eventId,
          matchId,
          teamNumber: t.teamNumber,
          alliance: "blue",
          position: idx + 1,
        });
      }
    }

    await batchInsert(db, schemaTables.teamMatch, teamMatchInserts);

    const teamMatchRows = await db
      .select({
        id: schemaTables.teamMatch.id,
        matchId: schemaTables.teamMatch.matchId,
        teamNumber: schemaTables.teamMatch.teamNumber,
      })
      .from(schemaTables.teamMatch)
      .where(eq(schemaTables.teamMatch.eventId, eventId));

    const tmIdMap = new Map(teamMatchRows.map((tm) => [`${tm.matchId}-${tm.teamNumber}`, tm.id]));

    // Insert stand forms — ~1.5 per team-match (always 1, 50% chance of a 2nd scout).
    // The second scout re-simulates independently from the same profile,
    // producing correlated-but-not-identical data to test consensus/median logic.
    type ScoutObservation = {
      standFormValue: {
        teamMatchId: number;
        scoutMemberId: string;
        comments: string;
        oofTimeSeconds: number;
      };
      simData: { cycles: SimulatedTeamMatch["cycles"]; climb: SimulatedTeamMatch["climb"] };
    };

    const observations: ScoutObservation[] = [];

    for (const result of simResults) {
      const matchId = matchIdByNumber.get(result.matchNumber);
      if (!matchId) continue;

      for (const teamResult of [...result.redTeams, ...result.blueTeams]) {
        const tmId = tmIdMap.get(`${matchId}-${teamResult.teamNumber}`);
        if (!tmId) continue;

        // First scout: use the match simulation data
        observations.push({
          standFormValue: {
            teamMatchId: tmId,
            scoutMemberId: randomMemberId(),
            comments: teamResult.comments,
            oofTimeSeconds: teamResult.oofTimeSeconds,
          },
          simData: { cycles: teamResult.cycles, climb: teamResult.climb },
        });

        // Second scout (50% chance): re-simulate from same profile
        if (Math.random() < 0.5) {
          const profile = profileMap.get(teamResult.teamNumber);
          if (profile) {
            const secondObs = simulateTeamMatch(profile);
            observations.push({
              standFormValue: {
                teamMatchId: tmId,
                scoutMemberId: randomMemberId(),
                comments: secondObs.comments,
                oofTimeSeconds: secondObs.oofTimeSeconds,
              },
              simData: { cycles: secondObs.cycles, climb: secondObs.climb },
            });
          }
        }
      }
    }

    // Batch insert all stand forms
    await batchInsert(
      db,
      schemaTables.standForm,
      observations.map((o) => o.standFormValue)
    );

    // Get stand form IDs back — multiple per teamMatchId now
    const sfRows = await db
      .select({ id: schemaTables.standForm.id, teamMatchId: schemaTables.standForm.teamMatchId })
      .from(schemaTables.standForm)
      .where(inArray(schemaTables.standForm.teamMatchId, [...tmIdMap.values()]));

    // Match stand form IDs to observations by insertion order per teamMatchId
    const sfByTmId = new Map<number, string[]>();
    for (const sf of sfRows) {
      const arr = sfByTmId.get(sf.teamMatchId) ?? [];
      arr.push(sf.id);
      sfByTmId.set(sf.teamMatchId, arr);
    }

    // Assign stand form IDs to observations
    const tmIdCounters = new Map<number, number>();
    const observationsWithSfId: { sfId: string; obs: ScoutObservation }[] = [];
    for (const obs of observations) {
      const tmId = obs.standFormValue.teamMatchId;
      const idx = tmIdCounters.get(tmId) ?? 0;
      tmIdCounters.set(tmId, idx + 1);
      const sfId = sfByTmId.get(tmId)?.[idx];
      if (sfId) {
        observationsWithSfId.push({ sfId, obs });
      }
    }

    // Insert cycles + climbs
    const cycleInserts: {
      standFormId: string;
      phase: "auto" | "teleop";
      cycleNumber: number;
      bucket: number;
      dumpDuration: string;
    }[] = [];

    const climbInserts: {
      standFormId: string;
      climbLevel: number;
      climbSuccess: boolean;
      climbDuration: string;
      climbPhase: "auto" | "teleop";
    }[] = [];

    for (const { sfId, obs } of observationsWithSfId) {
      for (const c of obs.simData.cycles) {
        cycleInserts.push({
          standFormId: sfId,
          phase: c.phase,
          cycleNumber: c.cycleNumber,
          bucket: c.bucket,
          dumpDuration: c.dumpDuration.toString(),
        });
      }

      if (obs.simData.climb) {
        climbInserts.push({
          standFormId: sfId,
          climbLevel: obs.simData.climb.climbLevel,
          climbSuccess: obs.simData.climb.climbSuccess,
          climbDuration: obs.simData.climb.climbDuration.toString(),
          climbPhase: obs.simData.climb.phase,
        });
      }
    }

    await batchInsert(db, schemaTables.cycle, cycleInserts);
    await batchInsert(db, schemaTables.climb, climbInserts);

    // Insert drive rankings
    for (const ranking of simDriveRankings) {
      const matchId = matchIdByNumber.get(ranking.matchNumber);
      if (!matchId) continue;

      const [inserted] = await db
        .insert(schemaTables.driveTeamRanking)
        .values({
          organizationId: orgId,
          matchId,
          alliance: ranking.alliance,
          scoutMemberId: randomScoutLeadId(),
        })
        .returning({ id: schemaTables.driveTeamRanking.id });

      if (!inserted) continue;

      await db.insert(schemaTables.driveTeamRankingEntry).values(
        ranking.rankedTeams.map((teamNumber, i) => ({
          rankingId: inserted.id,
          teamNumber,
          rank: i + 1,
        }))
      );
    }

    totalMatches += simResults.length;
    totalStandForms += observations.length;
    totalCycles += cycleInserts.length;
    totalClimbs += climbInserts.length;
    totalDriveRankings += simDriveRankings.length;

    const tag = planned.isDcmp ? "DCMP" : "District";
    console.log(
      `  ${planned.name}: ${planned.teamNumbers.length} teams, ${simResults.length} matches [${tag}]`
    );
  }

  // ── 6. Pit forms ─────────────────────────────────────────────

  console.log("Generating pit forms...");
  const pitForms = profiles.map((profile) => {
    const pit = simulatePitForm(profile);
    return {
      teamNumber: pit.teamNumber,
      scoutMemberId: randomMemberId(),
      drivetrainType: pit.drivetrainType,
      canTrench: pit.canTrench,
      canBump: pit.canBump,
      canShuttle: pit.canShuttle,
      capacity: pit.capacity,
      weight: pit.weight,
      climbType: pit.climbType,
      shooterType: pit.shooterType,
      canShootWhileMoving: pit.canShootWhileMoving,
    };
  });

  await batchInsert(db, schemaTables.pitForm, pitForms);

  // ── Done ─────────────────────────────────────────────────────

  console.log("\nSeed complete!");
  console.log(`  Teams: ${teamNumbers.length}`);
  console.log(`  Events: ${plannedEvents.length} (${plannedEvents.length - 1} district + 1 DCMP)`);
  console.log(`  Matches: ${totalMatches}`);
  console.log(
    `  Stand forms: ${totalStandForms} (~${(totalStandForms / (totalMatches * 6)).toFixed(1)} per team-match)`
  );
  console.log(`  Cycles: ${totalCycles}`);
  console.log(`  Climbs: ${totalClimbs}`);
  console.log(`  Drive rankings: ${totalDriveRankings}`);
  console.log(`  Pit forms: ${pitForms.length}`);
  console.log(`\n  Org: "Seed Organization" (slug: seed-org)`);
  console.log(`  Owner: seed@polar-edge.dev`);
  console.log(`  Scout leads: Turbo McSenderson, Wrench Monkey`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
