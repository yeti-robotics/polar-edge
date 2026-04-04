import { sql } from "drizzle-orm";
import { check, integer, pgTable, smallint, unique, uuid } from "drizzle-orm/pg-core";
import { driveTeamRanking } from "./drive-team-ranking";
import { team } from "./team";

export const driveTeamRankingEntry = pgTable(
  "drive_team_ranking_entry",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    rankingId: uuid("ranking_id")
      .notNull()
      .references(() => driveTeamRanking.id, { onDelete: "cascade" }),

    teamNumber: integer("team_number")
      .notNull()
      .references(() => team.teamNumber),

    rank: smallint("rank").notNull(),
  },
  (t) => [
    {
      rankConstraint: check("drive_rank_constraint", sql`${t.rank} in (1, 2, 3)`),
    },
    unique("uniq_ranking_team").on(t.rankingId, t.teamNumber),
    unique("uniq_ranking_rank").on(t.rankingId, t.rank),
  ]
);
