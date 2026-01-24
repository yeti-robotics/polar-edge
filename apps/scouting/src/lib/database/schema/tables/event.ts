import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const event = pgTable("event", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventCode: varchar("event_code", { length: 16 }).notNull().unique(),
  name: text("name").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
