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
ALTER TABLE "organization_invite_link" ADD CONSTRAINT "organization_invite_link_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_link" ADD CONSTRAINT "organization_invite_link_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_invite_link_organizationId_idx" ON "organization_invite_link" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_invite_link_token_idx" ON "organization_invite_link" USING btree ("token");