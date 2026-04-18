CREATE TABLE "scouting_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"info_sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"shift_sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by_member_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scouting_schedule_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"team_match_id" bigint NOT NULL,
	"member_id" text NOT NULL,
	"slot_index" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scouting_schedule_assignment_slot_check" CHECK ("scouting_schedule_assignment"."slot_index" in (1, 2))
);
--> statement-breakpoint
ALTER TABLE "scouting_schedule" ADD CONSTRAINT "scouting_schedule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_schedule" ADD CONSTRAINT "scouting_schedule_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_schedule" ADD CONSTRAINT "scouting_schedule_created_by_member_id_member_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_schedule_assignment" ADD CONSTRAINT "scouting_schedule_assignment_schedule_id_scouting_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."scouting_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_schedule_assignment" ADD CONSTRAINT "scouting_schedule_assignment_team_match_id_team_match_id_fk" FOREIGN KEY ("team_match_id") REFERENCES "public"."team_match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_schedule_assignment" ADD CONSTRAINT "scouting_schedule_assignment_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_scouting_schedule_organization" ON "scouting_schedule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_scouting_schedule_event" ON "scouting_schedule" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_scouting_schedule_organization_open" ON "scouting_schedule" USING btree ("organization_id","is_open");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_scouting_schedule_assignment_slot" ON "scouting_schedule_assignment" USING btree ("schedule_id","team_match_id","slot_index");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_scouting_schedule_assignment_member" ON "scouting_schedule_assignment" USING btree ("schedule_id","team_match_id","member_id");--> statement-breakpoint
CREATE INDEX "idx_scouting_schedule_assignment_schedule" ON "scouting_schedule_assignment" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_scouting_schedule_assignment_member" ON "scouting_schedule_assignment" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_scouting_schedule_assignment_team_match" ON "scouting_schedule_assignment" USING btree ("team_match_id");--> statement-breakpoint
