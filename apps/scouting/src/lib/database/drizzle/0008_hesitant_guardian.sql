CREATE TABLE "picklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"created_by_member_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "picklist_team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"picklist_id" uuid NOT NULL,
	"team_number" integer NOT NULL,
	"rank" smallint NOT NULL,
	CONSTRAINT "uniq_picklist_team_number" UNIQUE("picklist_id","team_number"),
	CONSTRAINT "uniq_picklist_rank" UNIQUE("picklist_id","rank")
);
--> statement-breakpoint
ALTER TABLE "picklist" ADD CONSTRAINT "picklist_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picklist" ADD CONSTRAINT "picklist_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picklist" ADD CONSTRAINT "picklist_created_by_member_id_member_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picklist_team" ADD CONSTRAINT "picklist_team_picklist_id_picklist_id_fk" FOREIGN KEY ("picklist_id") REFERENCES "public"."picklist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picklist_team" ADD CONSTRAINT "picklist_team_team_number_team_team_number_fk" FOREIGN KEY ("team_number") REFERENCES "public"."team"("team_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_picklist_org_event" ON "picklist" USING btree ("organization_id","event_id");--> statement-breakpoint
CREATE INDEX "idx_picklist_team_picklist" ON "picklist_team" USING btree ("picklist_id");