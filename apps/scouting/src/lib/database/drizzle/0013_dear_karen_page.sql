CREATE TYPE "public"."workability_role" AS ENUM('driver', 'human_player');--> statement-breakpoint
CREATE TABLE "workability_form" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"team_number" integer NOT NULL,
	"scout_member_id" text,
	"role" "workability_role" NOT NULL,
	"rating" smallint NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_workability_submission" UNIQUE("event_id","team_number","scout_member_id","role"),
	CONSTRAINT "workability_rating_range" CHECK ("workability_form"."rating" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "workability_form" ADD CONSTRAINT "workability_form_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workability_form" ADD CONSTRAINT "workability_form_team_number_team_team_number_fk" FOREIGN KEY ("team_number") REFERENCES "public"."team"("team_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workability_form" ADD CONSTRAINT "workability_form_scout_member_id_member_id_fk" FOREIGN KEY ("scout_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_workability_event_team" ON "workability_form" USING btree ("event_id","team_number");--> statement-breakpoint
CREATE INDEX "idx_workability_member" ON "workability_form" USING btree ("scout_member_id");--> statement-breakpoint
CREATE INDEX "idx_workability_event_team_role" ON "workability_form" USING btree ("event_id","team_number","role");
