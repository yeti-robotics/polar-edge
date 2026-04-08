CREATE TABLE "drive_team_ranking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"match_id" uuid NOT NULL,
	"alliance" "alliance" NOT NULL,
	"scout_member_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_drive_ranking_org_match_alliance" UNIQUE("organization_id","match_id","alliance")
);
--> statement-breakpoint
CREATE TABLE "drive_team_ranking_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ranking_id" uuid NOT NULL,
	"team_number" integer NOT NULL,
	"rank" smallint NOT NULL,
	CONSTRAINT "uniq_ranking_team" UNIQUE("ranking_id","team_number"),
	CONSTRAINT "uniq_ranking_rank" UNIQUE("ranking_id","rank")
);
--> statement-breakpoint
ALTER TABLE "drive_team_ranking" ADD CONSTRAINT "drive_team_ranking_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_team_ranking" ADD CONSTRAINT "drive_team_ranking_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_team_ranking" ADD CONSTRAINT "drive_team_ranking_scout_member_id_member_id_fk" FOREIGN KEY ("scout_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_team_ranking_entry" ADD CONSTRAINT "drive_team_ranking_entry_ranking_id_drive_team_ranking_id_fk" FOREIGN KEY ("ranking_id") REFERENCES "public"."drive_team_ranking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_team_ranking_entry" ADD CONSTRAINT "drive_team_ranking_entry_team_number_team_team_number_fk" FOREIGN KEY ("team_number") REFERENCES "public"."team"("team_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_drive_ranking_match" ON "drive_team_ranking" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_drive_ranking_org" ON "drive_team_ranking" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_drive_ranking_scout" ON "drive_team_ranking" USING btree ("scout_member_id");