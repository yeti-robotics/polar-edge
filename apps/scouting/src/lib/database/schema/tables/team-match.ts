import { sql } from "drizzle-orm";
import { check, integer, pgTable, primaryKey, smallint, varchar } from "drizzle-orm/pg-core";
import { allianceEnum } from "../types/alliance-enum";
import { match } from "./match";
import { team } from "./team";

export const teamMatch = pgTable(
  "team_match",
  {
    matchId: varchar("match_id", { length: 32 })
      .notNull()
      .references(() => match.id),
    teamNumber: integer("team_number")
      .notNull()
      .references(() => team.teamNumber),
    alliance: allianceEnum().notNull(),
    alliancePosition: smallint("alliance_position").notNull(),
  },
  (table) => [
    {
      alliancePositionConstraint: check(
        "alliance_position_constraint",
        sql`${table.alliancePosition} in (1,2,3)`
      ),
    },
    primaryKey({ columns: [table.matchId, table.teamNumber] }),
  ]
);
