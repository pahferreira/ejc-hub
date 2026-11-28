CREATE TYPE "public"."schedule_note_author_role" AS ENUM('admin', 'coordinator');--> statement-breakpoint
CREATE TABLE "schedule_activity_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"author_role" "schedule_note_author_role" NOT NULL,
	"team_instance_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_activity_notes_body_length_check" CHECK (char_length("schedule_activity_notes"."body") between 1 and 500),
	CONSTRAINT "schedule_activity_notes_team_matches_role_check" CHECK (("schedule_activity_notes"."author_role" = 'coordinator') = ("schedule_activity_notes"."team_instance_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "schedule_activity_notes" ADD CONSTRAINT "schedule_activity_notes_activity_id_schedule_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."schedule_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_activity_notes" ADD CONSTRAINT "schedule_activity_notes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_activity_notes" ADD CONSTRAINT "schedule_activity_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_activity_notes" ADD CONSTRAINT "schedule_activity_notes_team_instance_event_fk" FOREIGN KEY ("team_instance_id","event_id") REFERENCES "public"."team_instances"("id","event_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "schedule_activity_notes_event_id_created_at_idx" ON "schedule_activity_notes" USING btree ("event_id","created_at");