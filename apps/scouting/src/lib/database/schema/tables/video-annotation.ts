import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { annotationTypeEnum } from "../types/annotation-type-enum";
import { annotationVerdictEnum } from "../types/annotation-verdict-enum";
import { matchVideo } from "./match-video";
import { member } from "./member";
import { organization } from "./organization";
import { team } from "./team";

// Normalized 0..1 fractions of the canvas box, not pixels.
export type AnnotationPoints = { x: number; y: number }[];

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

    timestampSeconds: integer("timestamp_seconds").notNull(),
    durationSeconds: integer("duration_seconds").notNull().default(6),

    type: annotationTypeEnum("type").notNull(),
    points: jsonb("points").$type<AnnotationPoints>().notNull(),

    verdict: annotationVerdictEnum("verdict"),
    note: text("note"),

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
    index("idx_video_annotation_team_verdict")
      .on(table.teamNumber, table.verdict, table.createdAt.desc())
      .where(sql`${table.verdict} is not null`),
    index("idx_video_annotation_team_notes")
      .on(table.teamNumber, table.createdAt.desc())
      .where(sql`${table.note} is not null`),
  ]
);
