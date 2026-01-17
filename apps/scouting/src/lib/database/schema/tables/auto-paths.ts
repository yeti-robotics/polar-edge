import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { match } from "./match";
import { organization } from "./organization";
import { team } from "./team";
import { user } from "./user";

export const autoPath = pgTable(
  "auto_path",
  {
    id: text("id").primaryKey(),
    teamNumber: integer("team_number")
      .notNull()
      .references(() => team.teamNumber),
    matchId: varchar("match_id", { length: 32 })
      .notNull()
      .references(() => match.id),
    pathData: jsonb("path_data").notNull(),
    hasL1Climb: boolean("has_l1_climb").default(false).notNull(),
    fieldImageUrl: text("field_image_url"),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("auto_path_team_number_idx").on(table.teamNumber),
    index("auto_path_match_id_idx").on(table.matchId),
    index("auto_path_organization_id_idx").on(table.organizationId),
    index("auto_path_created_by_id_idx").on(table.createdById),
  ]
);
