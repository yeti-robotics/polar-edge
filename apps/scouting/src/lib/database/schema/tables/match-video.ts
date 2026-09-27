import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { videoSourceEnum } from "../types/video-source-enum";
import { event } from "./event";
import { match } from "./match";
import { member } from "./member";
import { organization } from "./organization";

/**
 * A reviewable piece of match footage.
 *
 * Two sources: a pasted/dropped YouTube link, or a clip uploaded from the
 * iPad's photo library. Uploads live in S3-compatible storage like pit photos,
 * so only the `storage_key` is stored here.
 */
export const matchVideo = pgTable(
  "match_video",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    source: videoSourceEnum("source").notNull().default("youtube"),
    /** Original URL for youtube sources */
    url: text("url"),
    /** Parsed YouTube id, so clients don't re-parse the URL */
    youtubeId: text("youtube_id"),
    /** Object key in Spaces for uploaded clips */
    storageKey: text("storage_key"),

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
    check(
      "match_video_source_target",
      sql`(${table.source} = 'youtube' and ${table.youtubeId} is not null) or (${table.source} = 'upload' and ${table.storageKey} is not null)`
    ),
    index("idx_match_video_organization").on(table.organizationId),
    index("idx_match_video_org_match").on(table.organizationId, table.matchId),
    index("idx_match_video_event").on(table.eventId),
  ]
);

export type MatchVideoRow = typeof matchVideo.$inferSelect;
export type NewMatchVideo = typeof matchVideo.$inferInsert;
