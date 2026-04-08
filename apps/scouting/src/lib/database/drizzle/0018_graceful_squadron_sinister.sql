ALTER TABLE "drive_team_ranking" DROP CONSTRAINT "drive_team_ranking_match_id_match_id_fk";
--> statement-breakpoint
ALTER TABLE "drive_team_ranking" ADD CONSTRAINT "drive_team_ranking_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;
