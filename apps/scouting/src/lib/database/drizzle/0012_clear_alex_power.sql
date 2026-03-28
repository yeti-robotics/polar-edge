CREATE TYPE "public"."shooter_type" AS ENUM('turret', 'fixed');--> statement-breakpoint
ALTER TABLE "pit_form" ADD COLUMN "shooter_type" "shooter_type";--> statement-breakpoint
ALTER TABLE "pit_form" ADD COLUMN "can_shoot_while_moving" boolean DEFAULT false NOT NULL;