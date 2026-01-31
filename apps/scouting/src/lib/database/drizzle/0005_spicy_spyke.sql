CREATE TABLE "organization_event" (
	"organization_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	CONSTRAINT "organization_event_organization_id_event_id_pk" PRIMARY KEY("organization_id","event_id")
);
--> statement-breakpoint
ALTER TABLE "organization_event" ADD CONSTRAINT "organization_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_event" ADD CONSTRAINT "organization_event_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_event_eventId_idx" ON "organization_event" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "organization_event_organizationId_isActive_idx" ON "organization_event" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_event_one_active_per_org_idx" ON "organization_event" ("organization_id") WHERE "is_active" = true;