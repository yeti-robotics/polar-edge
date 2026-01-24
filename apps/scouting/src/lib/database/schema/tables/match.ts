import { index, integer, pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { matchTypeEnum } from "../types";
import { event } from "./event";

export const match = pgTable(
  "match",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id),

    matchType: matchTypeEnum("match_type").notNull(),
    matchNumber: integer("match_number").notNull(),

    redScore: integer("red_score"),
    blueScore: integer("blue_score"),
  },
  (table) => [
    unique("uniq_match_event").on(table.eventId, table.matchNumber, table.matchType),
    index("idx_match_event").on(table.eventId),
  ]
);
