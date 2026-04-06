import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { event } from "./event";
import { organization } from "./organization";

export const shiftSchedule = pgTable(
  "shift_schedule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    scheduleData: jsonb("schedule_data").notNull().default({ entries: [] }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("shift_schedule_org_event_uidx").on(table.organizationId, table.eventId),
    index("shift_schedule_org_idx").on(table.organizationId),
    index("shift_schedule_event_idx").on(table.eventId),
  ]
);
