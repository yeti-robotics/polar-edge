import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  varchar,
} from "drizzle-orm/pg-core";

// === BEGIN AUTO GENERATED CODE BY BETTER AUTH ===

// === END AUTO GENERATED CODE BY BETTER AUTH ===

export const cageEnum = pgEnum("cage", ["None", "ShallowCage", "DeepCage", "Parked"]);
export const allianceEnum = pgEnum("alliance", ["red", "blue", ""]);

export const match = pgTable("match", {
  id: varchar("match_id", { length: 32 }).notNull().primaryKey(),
  compLevel: varchar("comp_level", { length: 2 }).notNull(),
  setNumber: smallint("set_number").notNull(),
  matchNumber: smallint("match_number").notNull(),
  eventKey: varchar("event_key", { length: 16 }).notNull(),
  winningAlliance: allianceEnum("winning_alliance").notNull(),
});

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

export const event = pgTable("event", {
  key: varchar("event_key", { length: 16 }).notNull().primaryKey(),
  eventName: varchar("event_name", { length: 256 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
});

export const team = pgTable("team", {
  teamNumber: integer("team_number").notNull().primaryKey(),
  teamName: varchar("team_name", { length: 256 }).notNull().default(""),
});
