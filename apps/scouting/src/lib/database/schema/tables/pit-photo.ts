import { index, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pitForm } from "./pit-form";

export const pitPhoto = pgTable(
  "pit_photo",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    pitFormId: uuid("pit_form_id")
      .notNull()
      .references(() => pitForm.id, { onDelete: "cascade" }),

    storageKey: text("storage_key").notNull(),
    index: smallint("index").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_pit_photo_pit_form_id").on(t.pitFormId)]
);
