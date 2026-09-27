CREATE TYPE "public"."annotation_type" AS ENUM('pen', 'line', 'arrow', 'rect', 'ellipse');--> statement-breakpoint
CREATE TYPE "public"."annotation_verdict" AS ENUM('good', 'bad');--> statement-breakpoint
CREATE TYPE "public"."video_source" AS ENUM('youtube', 'upload');--> statement-breakpoint
CREATE TABLE "match_video" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"source" "video_source" DEFAULT 'youtube' NOT NULL,
	"url" text,
	"youtube_id" text,
	"storage_key" text,
	"title" text NOT NULL,
	"match_id" uuid,
	"event_id" uuid,
	"created_by_member_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_video_source_target" CHECK (("match_video"."source" = 'youtube' and "match_video"."youtube_id" is not null) or ("match_video"."source" = 'upload' and "match_video"."storage_key" is not null))
);
--> statement-breakpoint
CREATE TABLE "video_annotation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"timestamp_seconds" integer NOT NULL,
	"duration_seconds" integer DEFAULT 6 NOT NULL,
	"type" "annotation_type" NOT NULL,
	"points" jsonb NOT NULL,
	"verdict" "annotation_verdict",
	"note" text,
	"team_number" integer,
	"created_by_member_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_annotation_duration_positive" CHECK ("video_annotation"."duration_seconds" > 0),
	CONSTRAINT "video_annotation_timestamp_nonnegative" CHECK ("video_annotation"."timestamp_seconds" >= 0),
	CONSTRAINT "video_annotation_points_is_array" CHECK (jsonb_typeof("video_annotation"."points") = 'array')
);
--> statement-breakpoint
ALTER TABLE "match_video" ADD CONSTRAINT "match_video_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_video" ADD CONSTRAINT "match_video_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_video" ADD CONSTRAINT "match_video_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_video" ADD CONSTRAINT "match_video_created_by_member_id_member_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_annotation" ADD CONSTRAINT "video_annotation_video_id_match_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."match_video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_annotation" ADD CONSTRAINT "video_annotation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_annotation" ADD CONSTRAINT "video_annotation_team_number_team_team_number_fk" FOREIGN KEY ("team_number") REFERENCES "public"."team"("team_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_annotation" ADD CONSTRAINT "video_annotation_created_by_member_id_member_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_match_video_organization" ON "match_video" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_match_video_org_match" ON "match_video" USING btree ("organization_id","match_id");--> statement-breakpoint
CREATE INDEX "idx_match_video_event" ON "match_video" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_video_annotation_video_time" ON "video_annotation" USING btree ("video_id","timestamp_seconds");--> statement-breakpoint
CREATE INDEX "idx_video_annotation_team" ON "video_annotation" USING btree ("team_number");--> statement-breakpoint
CREATE INDEX "idx_video_annotation_organization" ON "video_annotation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_video_annotation_team_verdict" ON "video_annotation" USING btree ("team_number","verdict","created_at" DESC NULLS LAST) WHERE "video_annotation"."verdict" is not null;--> statement-breakpoint
CREATE INDEX "idx_video_annotation_team_notes" ON "video_annotation" USING btree ("team_number","created_at" DESC NULLS LAST) WHERE "video_annotation"."note" is not null;
