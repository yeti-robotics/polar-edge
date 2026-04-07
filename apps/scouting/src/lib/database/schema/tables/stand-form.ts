import {
  bigint,
  boolean,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { member } from "./member";
import { teamMatch } from "./team-match";

export const standForm = pgTable(
  "stand_form",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    teamMatchId: bigint("team_match_id", { mode: "number" })
      .notNull()
      .references(() => teamMatch.id),

    scoutMemberId: text("scout_member_id").references(() => member.id, { onDelete: "set null" }),

    comments: text("comments").notNull().default(""),
    canShuttle: boolean("can_shuttle"),
    oofTimeSeconds: smallint("oof_time_seconds").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_scout_report_team_match").on(t.teamMatchId),
    index("idx_stand_form_scout_member_id").on(t.scoutMemberId),
    index("idx_stand_form_team_match_member").on(t.teamMatchId, t.scoutMemberId),
  ]
);
