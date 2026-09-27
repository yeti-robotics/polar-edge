import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { annotationTypeEnum } from "../types/annotation-type-enum";
import { annotationVerdictEnum } from "../types/annotation-verdict-enum";
import { matchVideo } from "./match-video";
import { member } from "./member";
import { organization } from "./organization";
import { team } from "./team";

/** Stored in `points`: normalized 0..1 fractions of the canvas box. */
export type AnnotationPoints = { x: number; y: number }[];

/**
 * One mark drawn over match footage at a given second.
 *
 * Geometry is normalized, never pixels, so a mark drawn on an iPad lines up on
 * a projector. `note` is what rolls up onto the team analysis page.
 *
 * Deliberately NOT stored: colour (derived from `verdict`), stroke thickness
 * (one fixed client constant), match phase and quick tags (both replaced by
 * the good/bad verdict).
 */
export const videoAnnotation = pgTable(
  "video_annotation",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    videoId: uuid("video_id")
      .notNull()
      .references(() => matchVideo.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    /** Video time in whole seconds */
    timestampSeconds: integer("timestamp_seconds").notNull(),
    /** Clip length: out-point is `timestamp_seconds + duration_seconds` */
    durationSeconds: integer("duration_seconds").notNull().default(6),

    type: annotationTypeEnum("type").notNull(),
    /** Normalized geometry: [{ x, y }] with x/y in 0..1 */
    points: jsonb("points").$type<AnnotationPoints>().notNull(),

    /** Nullable: a mark can be saved unjudged. Drives the mark's colour. */
    verdict: annotationVerdictEnum("verdict"),
    /** Strategist's written note */
    note: text("note"),

    /** Alliance team the note is about, nullable */
    teamNumber: integer("team_number").references(() => team.teamNumber),

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
    check("video_annotation_duration_positive", sql`${table.durationSeconds} > 0`),
    check("video_annotation_timestamp_nonnegative", sql`${table.timestampSeconds} >= 0`),
    check("video_annotation_points_is_array", sql`jsonb_typeof(${table.points}) = 'array'`),
    index("idx_video_annotation_video_time").on(table.videoId, table.timestampSeconds),
    index("idx_video_annotation_team").on(table.teamNumber),
    index("idx_video_annotation_organization").on(table.organizationId),
    // Team-overview roll-up: "what did 3506 do well / badly at this event".
    index("idx_video_annotation_team_verdict")
      .on(table.teamNumber, table.verdict, table.createdAt.desc())
      .where(sql`${table.verdict} is not null`),
    // Rows carrying a written note, for the notes feed on the team page.
    index("idx_video_annotation_team_notes")
      .on(table.teamNumber, table.createdAt.desc())
      .where(sql`${table.note} is not null`),
  ]
);

export type VideoAnnotationRow = typeof videoAnnotation.$inferSelect;
export type NewVideoAnnotation = typeof videoAnnotation.$inferInsert;
