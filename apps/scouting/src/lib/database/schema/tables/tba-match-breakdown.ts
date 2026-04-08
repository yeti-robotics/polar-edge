import { bigint, index, pgTable, smallint, timestamp, uuid } from "drizzle-orm/pg-core";
import { teamMatch } from "./team-match";

export const tbaMatchBreakdown = pgTable(
  "tba_match_breakdown",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    teamMatchId: bigint("team_match_id", { mode: "number" })
      .notNull()
      .references(() => teamMatch.id)
      .unique(),

    autoClimbLevel: smallint("auto_climb_level"), // 0=None, 1=L1, 2=L2, 3=L3; null = not yet synced
    endgameClimbLevel: smallint("endgame_climb_level"), // 0=None, 1=L1, 2=L2, 3=L3; null = not yet synced

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_tba_breakdown_team_match").on(t.teamMatchId)]
);
