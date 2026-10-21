import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { event } from "./event";
import { match } from "./match";
import { member } from "./member";
import { organization } from "./organization";

export const matchVideo = pgTable(
  "match_video",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    url: text("url").notNull(),
    youtubeId: text("youtube_id").notNull(),

    title: text("title").notNull(),

    matchId: uuid("match_id").references(() => match.id),
    eventId: uuid("event_id").references(() => event.id),

    createdByMemberId: text("created_by_member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_match_video_organization").on(table.organizationId),
    index("idx_match_video_org_match").on(table.organizationId, table.matchId),
    index("idx_match_video_event").on(table.eventId),
  ]
);
