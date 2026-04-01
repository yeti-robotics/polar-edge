import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

async function main() {
  const { db } = await import("@/lib/database");
  const { event, teamMatch, driveTeamRanking, driveTeamRankingEntry, match } = await import(
    "../src/lib/database/schema/tables"
  );
  const { eq, and, lte, asc, sql } = await import("drizzle-orm");

  // Get first event
  const events = await db.select({ id: event.id, name: event.name, startDate: event.startDate }).from(event).limit(1);
  const eid = events[0]!.id;
  const orgId = "2be2e1de928e19d1fd7d93548a180397";

  console.log("Event:", events[0]!.name, "| ID:", eid);

  // Test: teams at this event via teamMatch.eventId
  const teamsAtEvent = await db
    .selectDistinct({ teamNumber: teamMatch.teamNumber })
    .from(teamMatch)
    .where(eq(teamMatch.eventId, eid));
  console.log("Teams at event (via teamMatch.eventId):", teamsAtEvent.length);

  // Test: observations with cutoff
  const targetEvent = await db.select({ startDate: event.startDate }).from(event).where(eq(event.id, eid)).limit(1);
  const cutoff = targetEvent[0]?.startDate;
  console.log("Cutoff date:", cutoff);

  const observations = await db
    .select({
      rankingId: driveTeamRanking.id,
      teamNumber: driveTeamRankingEntry.teamNumber,
      eventStartDate: event.startDate,
      eventCode: event.eventCode,
    })
    .from(driveTeamRankingEntry)
    .innerJoin(driveTeamRanking, eq(driveTeamRankingEntry.rankingId, driveTeamRanking.id))
    .innerJoin(match, eq(driveTeamRanking.matchId, match.id))
    .innerJoin(event, eq(match.eventId, event.id))
    .where(and(eq(driveTeamRanking.organizationId, orgId), lte(event.startDate, cutoff!)))
    .limit(5);

  console.log("Sample observations:", observations);

  const uniqueTeams = await db
    .select({ count: sql`count(distinct ${driveTeamRankingEntry.teamNumber})` })
    .from(driveTeamRankingEntry)
    .innerJoin(driveTeamRanking, eq(driveTeamRankingEntry.rankingId, driveTeamRanking.id))
    .innerJoin(match, eq(driveTeamRanking.matchId, match.id))
    .innerJoin(event, eq(match.eventId, event.id))
    .where(and(eq(driveTeamRanking.organizationId, orgId), lte(event.startDate, cutoff!)));

  console.log("Unique teams in observations (with cutoff):", uniqueTeams[0]!.count);
  console.log("Teams at event:", teamsAtEvent.length);

  // Check overlap
  const eventTeamNums = new Set(teamsAtEvent.map(t => t.teamNumber));
  const obsTeams = await db
    .selectDistinct({ teamNumber: driveTeamRankingEntry.teamNumber })
    .from(driveTeamRankingEntry)
    .innerJoin(driveTeamRanking, eq(driveTeamRankingEntry.rankingId, driveTeamRanking.id))
    .innerJoin(match, eq(driveTeamRanking.matchId, match.id))
    .innerJoin(event, eq(match.eventId, event.id))
    .where(and(eq(driveTeamRanking.organizationId, orgId), lte(event.startDate, cutoff!)));

  const obsTeamNums = obsTeams.map(t => t.teamNumber);
  const inEvent = obsTeamNums.filter(n => eventTeamNums.has(n));
  console.log("Observation teams:", obsTeamNums.length, "| In event:", inEvent.length);

  process.exit(0);
}

main();
