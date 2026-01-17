import { date, pgTable, varchar } from "drizzle-orm/pg-core";

export const event = pgTable("event", {
  key: varchar("event_key", { length: 16 }).notNull().primaryKey(),
  eventName: varchar("event_name", { length: 256 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
});
