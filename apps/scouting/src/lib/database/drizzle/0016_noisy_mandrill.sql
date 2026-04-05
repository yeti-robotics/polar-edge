DO $$
BEGIN
	CREATE TYPE "public"."workability_role" AS ENUM('driver', 'human_player');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END
$$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workability_form" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"team_number" integer NOT NULL,
	"scout_member_id" text,
	"role" "workability_role" NOT NULL,
	"rating" smallint NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workability_form" ADD COLUMN IF NOT EXISTS "match_id" uuid;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'workability_form_event_id_event_id_fk'
	) THEN
		ALTER TABLE "workability_form"
			ADD CONSTRAINT "workability_form_event_id_event_id_fk"
			FOREIGN KEY ("event_id") REFERENCES "public"."event"("id")
			ON DELETE cascade
			ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'workability_form_team_number_team_team_number_fk'
	) THEN
		ALTER TABLE "workability_form"
			ADD CONSTRAINT "workability_form_team_number_team_team_number_fk"
			FOREIGN KEY ("team_number") REFERENCES "public"."team"("team_number")
			ON DELETE no action
			ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'workability_form_scout_member_id_member_id_fk'
	) THEN
		ALTER TABLE "workability_form"
			ADD CONSTRAINT "workability_form_scout_member_id_member_id_fk"
			FOREIGN KEY ("scout_member_id") REFERENCES "public"."member"("id")
			ON DELETE set null
			ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'workability_form_match_id_match_id_fk'
	) THEN
		ALTER TABLE "workability_form"
			ADD CONSTRAINT "workability_form_match_id_match_id_fk"
			FOREIGN KEY ("match_id") REFERENCES "public"."match"("id")
			ON DELETE cascade
			ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'workability_rating_range'
	) THEN
		ALTER TABLE "workability_form"
			ADD CONSTRAINT "workability_rating_range"
			CHECK ("workability_form"."rating" between 1 and 5);
	END IF;
END
$$;
--> statement-breakpoint
ALTER TABLE "workability_form" DROP CONSTRAINT IF EXISTS "uniq_workability_submission";
--> statement-breakpoint
ALTER TABLE "workability_form"
	ADD CONSTRAINT "uniq_workability_submission"
	UNIQUE("match_id","team_number","scout_member_id","role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workability_event_team"
	ON "workability_form" USING btree ("event_id","team_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workability_member"
	ON "workability_form" USING btree ("scout_member_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workability_match_team"
	ON "workability_form" USING btree ("match_id","team_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workability_event_team_role"
	ON "workability_form" USING btree ("event_id","team_number","role");
