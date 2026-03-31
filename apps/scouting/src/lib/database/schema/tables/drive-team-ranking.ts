import { index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { allianceEnum } from "../types/alliance-enum";
import { match } from "./match";
import { member } from "./member";
import { organization } from "./organization";

export const driveTeamRanking = pgTable(
  "drive_team_ranking",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    matchId: uuid("match_id")
      .notNull()
      .references(() => match.id),

    alliance: allianceEnum("alliance").notNull(),

    scoutMemberId: text("scout_member_id").references(() => member.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("uniq_drive_ranking_org_match_alliance").on(t.organizationId, t.matchId, t.alliance),
    index("idx_drive_ranking_match").on(t.matchId),
    index("idx_drive_ranking_org").on(t.organizationId),
    index("idx_drive_ranking_scout").on(t.scoutMemberId),
  ]
);
