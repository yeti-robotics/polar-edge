import { index, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { phaseEnum } from "../types/phase-enum";
import { standForm } from "./stand-form";

export const climb = pgTable(
  "climb",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    standFormId: uuid("stand_form_id")
      .notNull()
      .references(() => standForm.id),

    climbDuration: numeric("climb_duration", { precision: 12, scale: 6 }).notNull(),

    climbPhase: phaseEnum("climb_phase").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_climbs_stand_form").on(t.standFormId)]
);
