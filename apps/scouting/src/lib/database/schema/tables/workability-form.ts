import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { workabilityRoleEnum } from "../types/workability-role-enum";
import { event } from "./event";
import { member } from "./member";
import { team } from "./team";

export const workabilityForm = pgTable(
  "workability_form",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),

    teamNumber: integer("team_number")
      .notNull()
      .references(() => team.teamNumber),

    scoutMemberId: text("scout_member_id").references(() => member.id, { onDelete: "set null" }),

    role: workabilityRoleEnum("role").notNull(),
    rating: smallint("rating").notNull(),
    notes: text("notes").notNull().default(""),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("workability_rating_range", sql`${table.rating} between 1 and 5`),
    index("idx_workability_event_team").on(table.eventId, table.teamNumber),
    index("idx_workability_member").on(table.scoutMemberId),
    index("idx_workability_event_team_role").on(table.eventId, table.teamNumber, table.role),
    unique("uniq_workability_submission").on(
      table.eventId,
      table.teamNumber,
      table.scoutMemberId,
      table.role
    ),
  ]
);
