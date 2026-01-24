import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  index,
  integer,
  pgTable,
  smallint,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { allianceEnum } from "../types/alliance-enum";
import { event } from "./event";
import { match } from "./match";
import { team } from "./team";

export const teamMatch = pgTable(
  "team_match",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id),
    matchId: uuid("match_id")
      .notNull()
      .references(() => match.id),

    teamNumber: integer("team_number")
      .notNull()
      .references(() => team.teamNumber),

    alliance: allianceEnum("alliance").notNull(),
    position: smallint("position").notNull(),

    surrogate: boolean("surrogate").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    {
      alliancePositionConstraint: check(
        "alliance_position_constraint",
        sql`${table.position} in (1,2,3)`
      ),
    },
    unique("uniq_team_per_match").on(table.matchId, table.teamNumber),
    index("uniq_alliance_slot_per_match").on(table.matchId, table.alliance, table.position),
    index("idx_team_match_event_team").on(table.eventId, table.teamNumber),
    index("idx_team_match_match").on(table.matchId),
  ]
);
