CREATE TYPE "public"."member_request_status" AS ENUM('pending', 'approved', 'denied', 'cancelled', 'outdated');--> statement-breakpoint
CREATE TABLE "member_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"team_instance_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"status" "member_request_status" DEFAULT 'pending' NOT NULL,
	"requested_by" uuid NOT NULL,
	"message" text,
	"resolved_at" timestamp,
	"resolved_by" uuid,
	"resolution_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_requests" ADD CONSTRAINT "member_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_requests" ADD CONSTRAINT "member_requests_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_requests" ADD CONSTRAINT "member_requests_team_instance_event_fk" FOREIGN KEY ("team_instance_id","event_id") REFERENCES "public"."team_instances"("id","event_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_requests" ADD CONSTRAINT "member_requests_subscription_fk" FOREIGN KEY ("user_id","event_id") REFERENCES "public"."subscriptions"("user_id","event_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "member_requests_open_team_user_idx" ON "member_requests" USING btree ("team_instance_id","user_id") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "member_requests_team_instance_id_status_idx" ON "member_requests" USING btree ("team_instance_id","status");--> statement-breakpoint
CREATE INDEX "member_requests_event_id_status_idx" ON "member_requests" USING btree ("event_id","status");

-- ============================================================================
-- ROLLBACK (manual — not applied by drizzle-kit migrate).
-- Purely additive migration; nothing reads these objects until the member
-- request feature ships, so this is safe to reverse. Indexes and foreign keys
-- drop with the table.
-- Run these statements by hand, in order, against the target database.
-- ============================================================================
--
-- DROP TABLE "member_requests";
-- DROP TYPE "public"."member_request_status";
-- ============================================================================
