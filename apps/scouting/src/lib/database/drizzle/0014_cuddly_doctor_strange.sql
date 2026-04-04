CREATE TABLE "team_event_copr" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"team_number" integer NOT NULL,
	"auto_fuel_count" numeric(18, 6) NOT NULL,
	"teleop_fuel_count" numeric(18, 6) NOT NULL,
	"endgame_fuel_count" numeric(18, 6) NOT NULL,
	"total_fuel_count" numeric(18, 6) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_team_event_copr" UNIQUE("event_id","team_number")
);
--> statement-breakpoint
ALTER TABLE "cycle" ALTER COLUMN "bucket" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team_event_copr" ADD CONSTRAINT "team_event_copr_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_event_copr" ADD CONSTRAINT "team_event_copr_team_number_team_team_number_fk" FOREIGN KEY ("team_number") REFERENCES "public"."team"("team_number") ON DELETE no action ON UPDATE no action;