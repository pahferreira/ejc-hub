CREATE TYPE "public"."schedule_activity_status" AS ENUM('planned', 'running', 'done', 'skipped');--> statement-breakpoint
ALTER TABLE "schedule_activities" ADD COLUMN "status" "schedule_activity_status" DEFAULT 'planned' NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_activities" ADD COLUMN "actual_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "schedule_activities" ADD COLUMN "actual_ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "schedule_activities" ADD COLUMN "adjusted_duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "schedule_activities" ADD COLUMN "controlled_by" uuid;--> statement-breakpoint
ALTER TABLE "schedule_activities" ADD CONSTRAINT "schedule_activities_controlled_by_users_id_fk" FOREIGN KEY ("controlled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_activities_one_running_per_event_idx" ON "schedule_activities" USING btree ("event_id") WHERE status = 'running';--> statement-breakpoint
ALTER TABLE "schedule_activities" ADD CONSTRAINT "schedule_activities_adjusted_duration_minutes_check" CHECK ("schedule_activities"."adjusted_duration_minutes" > 0);