CREATE TABLE "scout_assignment" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"team_match_id" bigint NOT NULL,
	"member_id" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_scout_assignment_team_match" UNIQUE("team_match_id")
);
--> statement-breakpoint
ALTER TABLE "scout_assignment" ADD CONSTRAINT "scout_assignment_team_match_id_team_match_id_fk" FOREIGN KEY ("team_match_id") REFERENCES "public"."team_match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_assignment" ADD CONSTRAINT "scout_assignment_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_scout_assignment_member" ON "scout_assignment" USING btree ("member_id");