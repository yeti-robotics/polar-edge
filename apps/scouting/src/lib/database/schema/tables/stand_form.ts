import { bigint, boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { member } from "./member";
import { teamMatch } from "./team-match";

export const standForm = pgTable(
  "stand_form",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    teamMatchId: bigint("team_match_id", { mode: "number" })
      .notNull()
      .references(() => teamMatch.id),

    scoutMemberId: uuid("scout_member_id").references(() => member.id),

    comments: text("comments").notNull().default(""),
    didBreak: boolean("did_break").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("idx_scout_report_team_match").on(t.teamMatchId)]
);
