CREATE TABLE "auto_path" (
	"id" text PRIMARY KEY NOT NULL,
	"team_number" integer NOT NULL,
	"match_id" varchar(32) NOT NULL,
	"path_data" jsonb NOT NULL,
	"has_l1_climb" boolean DEFAULT false NOT NULL,
	"field_image_url" text,
	"created_by_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auto_path" ADD CONSTRAINT "auto_path_team_number_team_team_number_fk" FOREIGN KEY ("team_number") REFERENCES "public"."team"("team_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_path" ADD CONSTRAINT "auto_path_match_id_match_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("match_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_path" ADD CONSTRAINT "auto_path_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_path" ADD CONSTRAINT "auto_path_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auto_path_team_number_idx" ON "auto_path" USING btree ("team_number");--> statement-breakpoint
CREATE INDEX "auto_path_match_id_idx" ON "auto_path" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "auto_path_organization_id_idx" ON "auto_path" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "auto_path_created_by_id_idx" ON "auto_path" USING btree ("created_by_id");