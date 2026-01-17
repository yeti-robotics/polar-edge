import { pgTable, smallint, varchar } from "drizzle-orm/pg-core";
import { allianceEnum } from "../types/alliance-enum";

export const match = pgTable("match", {
  id: varchar("match_id", { length: 32 }).notNull().primaryKey(),
  compLevel: varchar("comp_level", { length: 2 }).notNull(),
  setNumber: smallint("set_number").notNull(),
  matchNumber: smallint("match_number").notNull(),
  eventKey: varchar("event_key", { length: 16 }).notNull(),
  winningAlliance: allianceEnum("winning_alliance").notNull(),
});
