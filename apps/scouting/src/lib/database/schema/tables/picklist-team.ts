import { boolean, index, integer, pgTable, smallint, text, unique, uuid } from "drizzle-orm/pg-core";
import { picklist } from "./picklist";
import { team } from "./team";

export const picklistTeam = pgTable(
  "picklist_team",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    picklistId: uuid("picklist_id")
      .notNull()
      .references(() => picklist.id, { onDelete: "cascade" }),

    teamNumber: integer("team_number")
      .notNull()
      .references(() => team.teamNumber),

    rank: smallint("rank").notNull(),

    picked: boolean("picked").notNull().default(false),

    notes: text("notes").notNull().default(""),
  },
  (t) => [
    index("idx_picklist_team_picklist").on(t.picklistId),
    unique("uniq_picklist_team_number").on(t.picklistId, t.teamNumber),
    unique("uniq_picklist_rank").on(t.picklistId, t.rank),
  ]
);
