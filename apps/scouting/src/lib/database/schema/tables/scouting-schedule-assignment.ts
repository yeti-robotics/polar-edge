import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { member } from "./member";
import { scoutingSchedule } from "./scouting-schedule";
import { teamMatch } from "./team-match";

export const scoutingScheduleAssignment = pgTable(
  "scouting_schedule_assignment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => scoutingSchedule.id, { onDelete: "cascade" }),
    teamMatchId: bigint("team_match_id", { mode: "number" })
      .notNull()
      .references(() => teamMatch.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    slotIndex: smallint("slot_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check("scouting_schedule_assignment_slot_check", sql`${table.slotIndex} in (1, 2)`),
    uniqueIndex("uniq_scouting_schedule_assignment_slot").on(
      table.scheduleId,
      table.teamMatchId,
      table.slotIndex
    ),
    uniqueIndex("uniq_scouting_schedule_assignment_member").on(
      table.scheduleId,
      table.teamMatchId,
      table.memberId
    ),
    index("idx_scouting_schedule_assignment_schedule").on(table.scheduleId),
    index("idx_scouting_schedule_assignment_member").on(table.memberId),
    index("idx_scouting_schedule_assignment_team_match").on(table.teamMatchId),
  ]
);
