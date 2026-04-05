import { integer, numeric, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { event } from "./event";
import { team } from "./team";

export const teamEventCopr = pgTable(
  "team_event_copr",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id),

    teamNumber: integer("team_number")
      .notNull()
      .references(() => team.teamNumber),

    autoFuelCount: numeric("auto_fuel_count", { precision: 18, scale: 6 }).notNull(),
    teleopFuelCount: numeric("teleop_fuel_count", { precision: 18, scale: 6 }).notNull(),
    endgameFuelCount: numeric("endgame_fuel_count", { precision: 18, scale: 6 }).notNull(),
    totalFuelCount: numeric("total_fuel_count", { precision: 18, scale: 6 }).notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("uq_team_event_copr").on(t.eventId, t.teamNumber)]
);
