import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { member } from "./member";
import { team } from "./team";

export const autoPath = pgTable(
  "auto_path",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    pathData: jsonb("path_data").notNull(),
    teamNumber: integer("team_number")
      .notNull()
      .references(() => team.teamNumber),
    hasL1Climb: boolean("has_l1_climb").default(false).notNull(),
    fieldImageUrl: text("field_image_url"),
    createdByMemberId: text("created_by_member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("auto_path_created_by_member_id_idx").on(table.createdByMemberId),
    index("auto_path_team_number_idx").on(table.teamNumber),
  ]
);
