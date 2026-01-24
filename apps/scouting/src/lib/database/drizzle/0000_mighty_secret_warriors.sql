CREATE TYPE "public"."alliance" AS ENUM('red', 'blue');--> statement-breakpoint
CREATE TYPE "public"."climb_type" AS ENUM('sides', 'center', 'left', 'right', 'any');--> statement-breakpoint
CREATE TYPE "public"."drivetrain" AS ENUM('tank', 'swerve', 'mecanum', 'other');--> statement-breakpoint
CREATE TYPE "public"."match_type" AS ENUM('qm', 'ef', 'qf', 'sf', 'f');--> statement-breakpoint
CREATE TYPE "public"."phase" AS ENUM('auto', 'teleop');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_path" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"path_data" jsonb NOT NULL,
	"team_number" integer NOT NULL,
	"has_l1_climb" boolean DEFAULT false NOT NULL,
	"field_image_url" text,
	"created_by_member_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "climb" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stand_form_id" uuid NOT NULL,
	"climb_level" smallint DEFAULT 0 NOT NULL,
	"climb_success" boolean DEFAULT false NOT NULL,
	"climb_duration" numeric(12, 6) NOT NULL,
	"climb_phase" "phase" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cycle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stand_form_id" uuid NOT NULL,
	"phase" "phase" NOT NULL,
	"cycle_number" smallint NOT NULL,
	"bucket" smallint NOT NULL,
	"dump_duration" numeric(12, 6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_code" varchar(16) NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_event_code_unique" UNIQUE("event_code")
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"match_type" "match_type" NOT NULL,
	"match_number" integer NOT NULL,
	"red_score" integer,
	"blue_score" integer,
	CONSTRAINT "uniq_match_event" UNIQUE("event_id","match_number","match_type")
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "organization_invite_link" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_id" text NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invite_link_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "pit_form" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scout_member_id" text,
	"team_number" integer NOT NULL,
	"drivetrain" "drivetrain" NOT NULL,
	"can_trench" boolean DEFAULT false NOT NULL,
	"can_bump" boolean DEFAULT false NOT NULL,
	"can_shuttle" boolean DEFAULT false NOT NULL,
	"capacity" smallint DEFAULT 0 NOT NULL,
	"weight" smallint DEFAULT 0 NOT NULL,
	"climb_type" "climb_type",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "stand_form" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_match_id" bigint NOT NULL,
	"scout_member_id" text,
	"comments" text DEFAULT '' NOT NULL,
	"did_break" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "team" (
	"team_number" integer PRIMARY KEY NOT NULL,
	"team_name" varchar(256) DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_match" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"team_number" integer NOT NULL,
	"alliance" "alliance" NOT NULL,
	"position" smallint NOT NULL,
	"surrogate" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_team_per_match" UNIQUE("match_id","team_number")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_path" ADD CONSTRAINT "auto_path_team_number_team_team_number_fk" FOREIGN KEY ("team_number") REFERENCES "public"."team"("team_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_path" ADD CONSTRAINT "auto_path_created_by_member_id_member_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "climb" ADD CONSTRAINT "climb_stand_form_id_stand_form_id_fk" FOREIGN KEY ("stand_form_id") REFERENCES "public"."stand_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle" ADD CONSTRAINT "cycle_stand_form_id_stand_form_id_fk" FOREIGN KEY ("stand_form_id") REFERENCES "public"."stand_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_link" ADD CONSTRAINT "organization_invite_link_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_link" ADD CONSTRAINT "organization_invite_link_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pit_form" ADD CONSTRAINT "pit_form_scout_member_id_member_id_fk" FOREIGN KEY ("scout_member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pit_form" ADD CONSTRAINT "pit_form_team_number_team_team_number_fk" FOREIGN KEY ("team_number") REFERENCES "public"."team"("team_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stand_form" ADD CONSTRAINT "stand_form_team_match_id_team_match_id_fk" FOREIGN KEY ("team_match_id") REFERENCES "public"."team_match"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stand_form" ADD CONSTRAINT "stand_form_scout_member_id_member_id_fk" FOREIGN KEY ("scout_member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_match" ADD CONSTRAINT "team_match_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_match" ADD CONSTRAINT "team_match_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_match" ADD CONSTRAINT "team_match_team_number_team_team_number_fk" FOREIGN KEY ("team_number") REFERENCES "public"."team"("team_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auto_path_created_by_member_id_idx" ON "auto_path" USING btree ("created_by_member_id");--> statement-breakpoint
CREATE INDEX "auto_path_team_number_idx" ON "auto_path" USING btree ("team_number");--> statement-breakpoint
CREATE INDEX "idx_climbs_stand_form" ON "climb" USING btree ("stand_form_id");--> statement-breakpoint
CREATE INDEX "idx_cycle_stand_form" ON "cycle" USING btree ("stand_form_id");--> statement-breakpoint
CREATE INDEX "idx_cycle_phase" ON "cycle" USING btree ("stand_form_id","phase");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_match_event" ON "match" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organization_invite_link_organizationId_idx" ON "organization_invite_link" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_invite_link_token_idx" ON "organization_invite_link" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_pit_form_team_number" ON "pit_form" USING btree ("team_number");--> statement-breakpoint
CREATE INDEX "idx_pit_form_scout_member" ON "pit_form" USING btree ("scout_member_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_scout_report_team_match" ON "stand_form" USING btree ("team_match_id");--> statement-breakpoint
CREATE INDEX "uniq_alliance_slot_per_match" ON "team_match" USING btree ("match_id","alliance","position");--> statement-breakpoint
CREATE INDEX "idx_team_match_event_team" ON "team_match" USING btree ("event_id","team_number");--> statement-breakpoint
CREATE INDEX "idx_team_match_match" ON "team_match" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");