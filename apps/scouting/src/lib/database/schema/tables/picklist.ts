import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { event } from "./event";
import { member } from "./member";
import { organization } from "./organization";

export const picklist = pgTable(
  "picklist",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: text("name").notNull(),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),

    createdByMemberId: text("created_by_member_id").references(() => member.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("idx_picklist_org_event").on(t.organizationId, t.eventId)]
);
