import { index, numeric, pgTable, smallint, timestamp, uuid } from "drizzle-orm/pg-core";
import { phaseEnum } from "../types/phase-enum";
import { standForm } from "./stand_form";

export const cycle = pgTable(
  "cycle",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    standFormId: uuid("stand_form_id")
      .notNull()
      .references(() => standForm.id),

    phase: phaseEnum("phase").notNull(),
    cycleNumber: smallint("cycle_number").notNull(),

    bucket: smallint("bucket").notNull(),
    dumpDuration: numeric("dump_duration", { precision: 12, scale: 6 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_cycle_stand_form").on(t.standFormId),
    index("idx_cycle_phase").on(t.standFormId, t.phase),
  ]
);
