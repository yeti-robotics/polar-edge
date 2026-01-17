import { pgTable, smallint, varchar } from "drizzle-orm/pg-core";
import { allianceEnum } from "../types/alliance-enum";
import { event } from "./event";

export const match = pgTable("match", {
  id: varchar("match_id", { length: 32 }).notNull().primaryKey(),
  compLevel: varchar("comp_level", { length: 2 }).notNull(),
  setNumber: smallint("set_number").notNull(),
  matchNumber: smallint("match_number").notNull(),
  eventKey: varchar("event_key", { length: 16 }).notNull().references(()=> event.key),
  winningAlliance: allianceEnum("winning_alliance").notNull(),
});
