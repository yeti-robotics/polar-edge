import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { event } from "./event";
import { member } from "./member";
import { organization } from "./organization";

export interface ScoutingScheduleInfoItem {
  id: string;
  label: string;
  time: string;
}

export interface ScoutingScheduleInfoSection {
  id: string;
  dateLabel: string;
  items: ScoutingScheduleInfoItem[];
}

export interface ScoutingScheduleShiftSection {
  id: string;
  label: string;
  startMatch: number;
  endMatch: number;
  coordinatorMemberId: string | null;
}

export const scoutingSchedule = pgTable(
  "scouting_schedule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isOpen: boolean("is_open").notNull().default(true),
    infoSections: jsonb("info_sections")
      .$type<ScoutingScheduleInfoSection[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    shiftSections: jsonb("shift_sections")
      .$type<ScoutingScheduleShiftSection[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdByMemberId: text("created_by_member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_scouting_schedule_organization").on(table.organizationId),
    index("idx_scouting_schedule_event").on(table.eventId),
    index("idx_scouting_schedule_organization_open").on(table.organizationId, table.isOpen),
  ]
);
