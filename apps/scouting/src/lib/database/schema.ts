import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";

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

export const autoPath = pgTable(
  "auto_path",
  {
    id: text("id").primaryKey(),
    teamNumber: integer("team_number")
      .notNull()
      .references(() => team.teamNumber),
    matchId: varchar("match_id", { length: 32 })
      .notNull()
      .references(() => match.id),
    pathData: jsonb("path_data").notNull(),
    hasL1Climb: boolean("has_l1_climb").default(false).notNull(),
    fieldImageUrl: text("field_image_url"),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("auto_path_team_number_idx").on(table.teamNumber),
    index("auto_path_match_id_idx").on(table.matchId),
    index("auto_path_organization_id_idx").on(table.organizationId),
    index("auto_path_created_by_id_idx").on(table.createdById),
  ]
);
