CREATE TABLE "pit_photo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pit_form_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"index" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pit_form" DROP CONSTRAINT "pit_form_scout_member_id_member_id_fk";
--> statement-breakpoint
ALTER TABLE "stand_form" DROP CONSTRAINT "stand_form_scout_member_id_member_id_fk";
--> statement-breakpoint
ALTER TABLE "pit_photo" ADD CONSTRAINT "pit_photo_pit_form_id_pit_form_id_fk" FOREIGN KEY ("pit_form_id") REFERENCES "public"."pit_form"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pit_photo_pit_form_id" ON "pit_photo" USING btree ("pit_form_id");--> statement-breakpoint
ALTER TABLE "pit_form" ADD CONSTRAINT "pit_form_scout_member_id_member_id_fk" FOREIGN KEY ("scout_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stand_form" ADD CONSTRAINT "stand_form_scout_member_id_member_id_fk" FOREIGN KEY ("scout_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;