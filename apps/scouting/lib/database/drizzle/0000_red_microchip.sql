CREATE TYPE "public"."alliance" AS ENUM('red', 'blue', '');--> statement-breakpoint
CREATE TYPE "public"."cage" AS ENUM('None', 'ShallowCage', 'DeepCage', 'Parked');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'guest', 'banished');--> statement-breakpoint
CREATE TYPE "public"."yes_no" AS ENUM('Yes', 'No');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authenticator" (
	"credentialID" text NOT NULL,
	"userId" uuid NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match" (
	"match_id" varchar(32) PRIMARY KEY NOT NULL,
	"comp_level" varchar(2) NOT NULL,
	"set_number" smallint NOT NULL,
	"match_number" smallint NOT NULL,
	"event_key" varchar(16) NOT NULL,
	"winning_alliance" "alliance" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_score_breakdown" (
	"match_id" varchar(32) NOT NULL,
	"alliance" "alliance" NOT NULL,
	"auto_line_robot1" boolean NOT NULL,
	"auto_line_robot2" boolean NOT NULL,
	"auto_line_robot3" boolean NOT NULL,
	"auto_mobility_points" integer NOT NULL,
	"auto_points" integer NOT NULL,
	"auto_reef_top_row" integer NOT NULL,
	"auto_reef_mid_row" integer NOT NULL,
	"auto_reef_bot_row" integer NOT NULL,
	"auto_reef_trough" integer NOT NULL,
	"barge_bonus_achieved" boolean NOT NULL,
	"coopertition_criteria_met" boolean NOT NULL,
	"coral_bonus_achieved" boolean NOT NULL,
	"end_game_barge_points" integer NOT NULL,
	"end_game_robot1" "cage" NOT NULL,
	"end_game_robot2" "cage" NOT NULL,
	"end_game_robot3" "cage" NOT NULL,
	"foul_count" integer NOT NULL,
	"foul_points" integer NOT NULL,
	"g206_penalty" boolean NOT NULL,
	"g408_penalty" boolean NOT NULL,
	"g424_penalty" boolean NOT NULL,
	"net_algae_count" integer NOT NULL,
	"rp" integer NOT NULL,
	"tech_foul_count" integer NOT NULL,
	"teleop_coral_count" integer NOT NULL,
	"teleop_coral_points" integer NOT NULL,
	"teleop_points" integer NOT NULL,
	"teleop_reef_top_row" integer NOT NULL,
	"teleop_reef_mid_row" integer NOT NULL,
	"teleop_reef_bot_row" integer NOT NULL,
	"teleop_reef_trough" integer NOT NULL,
	"total_points" integer NOT NULL,
	"wall_algae_count" integer NOT NULL,
	CONSTRAINT "match_score_breakdown_match_id_alliance_pk" PRIMARY KEY("match_id","alliance")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stand_form" (
	"stand_form_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_number" integer NOT NULL,
	"match_id" varchar(32) NOT NULL,
	"user_id" uuid NOT NULL,
	"left_black_line" boolean NOT NULL,
	"auto_coral_level1" integer NOT NULL,
	"auto_coral_level2" integer NOT NULL,
	"auto_coral_level3" integer NOT NULL,
	"auto_coral_level4" integer NOT NULL,
	"auto_algae_processed" integer NOT NULL,
	"auto_algae_netted" integer NOT NULL,
	"teleop_coral_level1" integer NOT NULL,
	"teleop_coral_level2" integer NOT NULL,
	"teleop_coral_level3" integer NOT NULL,
	"teleop_coral_level4" integer NOT NULL,
	"teleop_algae_processed" integer NOT NULL,
	"teleop_algae_netted" integer NOT NULL,
	"teleop_algae_thrown" integer NOT NULL,
	"cage_climb" "cage" NOT NULL,
	"defense_rating" integer NOT NULL,
	"comments" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team" (
	"team_number" serial PRIMARY KEY NOT NULL,
	"team_name" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_match" (
	"match_id" varchar(32) NOT NULL,
	"team_number" integer NOT NULL,
	"alliance" "alliance" NOT NULL,
	"alliance_position" smallint NOT NULL,
	CONSTRAINT "team_match_match_id_team_number_pk" PRIMARY KEY("match_id","team_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tournament" (
	"tournament_id" varchar(16) PRIMARY KEY NOT NULL,
	"event_name" varchar(256) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"guildNickname" text,
	"role" "user_role" DEFAULT 'user',
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_score_breakdown" ADD CONSTRAINT "match_score_breakdown_match_id_match_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("match_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stand_form" ADD CONSTRAINT "stand_form_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stand_form" ADD CONSTRAINT "stand_form_team_number_match_id_team_match_team_number_match_id_fk" FOREIGN KEY ("team_number","match_id") REFERENCES "public"."team_match"("team_number","match_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_match" ADD CONSTRAINT "team_match_match_id_match_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("match_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_match" ADD CONSTRAINT "team_match_team_number_team_team_number_fk" FOREIGN KEY ("team_number") REFERENCES "public"."team"("team_number") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tournament_current_idx" ON "tournament" USING btree ("is_current") WHERE "tournament"."is_current" = true;--> statement-breakpoint
CREATE VIEW "public"."team_stats" AS (
WITH combinedStats AS (
    SELECT 
        tf.team_number, 
        tf.match_id, 
        AVG(tf.auto_coral_level1) AS auto_coral_level_1, 
        AVG(tf.auto_coral_level2) AS auto_coral_level_2, 
        AVG(tf.auto_coral_level3) AS auto_coral_level_3, 
        AVG(tf.auto_coral_level4) AS auto_coral_level_4,
        AVG(tf.auto_algae_processed) AS auto_algae_processor, 
        AVG(tf.auto_algae_netted) AS auto_algae_net,
        AVG(tf.teleop_coral_level1) AS teleop_coral_level_1, 
        AVG(tf.teleop_coral_level2) AS teleop_coral_level_2, 
        AVG(tf.teleop_coral_level3) AS teleop_coral_level_3, 
        AVG(tf.teleop_coral_level4) AS teleop_coral_level_4,
        AVG(tf.teleop_algae_processed) AS teleop_algae_processor, 
        AVG(tf.teleop_algae_netted) AS teleop_algae_net,
        AVG(tf.teleop_algae_thrown) AS teleop_algae_thrown, 
        AVG(tf.defense_rating) AS defense_rating,
        CAST(SUM(CASE WHEN tf.left_black_line THEN 1 ELSE 0 END) AS REAL) / COUNT(*) AS initiation_line,
        CAST(SUM(CASE WHEN tf.cage_climb = 'Parked' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) AS park_percentage,
        CAST(SUM(CASE WHEN tf.cage_climb = 'DeepCage' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) AS deep_percentage,
        CAST(SUM(CASE WHEN tf.cage_climb = 'ShallowCage' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) AS shallow_percentage
    FROM stand_form tf
    GROUP BY tf.team_number, tf.match_id
),
teamMatches AS (
    SELECT 
        tm.team_number, 
        t.team_name, 
        tm.match_id
    FROM team_match tm 
    JOIN team t ON tm.team_number = t.team_number
)
SELECT
    cs.auto_coral_level_1,
    cs.auto_coral_level_2,
    cs.auto_coral_level_3,
    cs.auto_coral_level_4,
    cs.auto_algae_processor,
    cs.auto_algae_net,
    cs.teleop_coral_level_1,
    cs.teleop_coral_level_2,
    cs.teleop_coral_level_3,
    cs.teleop_coral_level_4,
    cs.teleop_algae_processor,
    cs.teleop_algae_net,
    cs.teleop_algae_thrown,
    cs.defense_rating,
    cs.initiation_line,
    cs.park_percentage,
    cs.deep_percentage,
    cs.shallow_percentage,
    tm.team_number,
    tm.team_name
FROM
    combinedStats cs
JOIN
    teamMatches tm ON cs.team_number = tm.team_number AND cs.match_id = tm.match_id
ORDER BY
    tm.team_number
);