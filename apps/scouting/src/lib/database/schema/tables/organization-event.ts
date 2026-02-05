import { boolean, index, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { event } from "./event";
import { organization } from "./organization";

export const organizationEvent = pgTable(
  "organization_event",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").default(false).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.eventId] }),
    index("organization_event_eventId_idx").on(table.eventId),
    index("organization_event_organizationId_isActive_idx").on(
      table.organizationId,
      table.isActive
    ),
  ]
);
