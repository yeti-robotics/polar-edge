import { bigint, bigserial, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { member } from "./member";
import { teamMatch } from "./team-match";

export const scoutAssignment = pgTable(
  "scout_assignment",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    teamMatchId: bigint("team_match_id", { mode: "number" })
      .notNull()
      .references(() => teamMatch.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uniq_scout_assignment_team_match").on(table.teamMatchId),
    index("idx_scout_assignment_member").on(table.memberId),
  ]
);
