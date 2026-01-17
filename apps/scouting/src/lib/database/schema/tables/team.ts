import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const team = pgTable("team", {
  teamNumber: integer("team_number").notNull().primaryKey(),
  teamName: varchar("team_name", { length: 256 }).notNull().default(""),
});
