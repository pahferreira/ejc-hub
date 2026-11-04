CREATE TABLE "schedule_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"title" text NOT NULL,
	"planned_starts_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"place" text NOT NULL,
	"guest_name" text,
	"admins_responsible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_activities_duration_minutes_check" CHECK ("schedule_activities"."duration_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "schedule_activity_teams" (
	"activity_id" uuid NOT NULL,
	"team_instance_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	CONSTRAINT "schedule_activity_teams_pk" PRIMARY KEY("activity_id","team_instance_id")
);
--> statement-breakpoint
CREATE TABLE "schedule_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_days_event_id_date_unique" UNIQUE("event_id","date"),
	CONSTRAINT "schedule_days_id_event_id_unique" UNIQUE("id","event_id")
);
--> statement-breakpoint
ALTER TABLE "schedule_activities" ADD CONSTRAINT "schedule_activities_day_event_fk" FOREIGN KEY ("day_id","event_id") REFERENCES "public"."schedule_days"("id","event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_activity_teams" ADD CONSTRAINT "schedule_activity_teams_activity_id_schedule_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."schedule_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_activity_teams" ADD CONSTRAINT "schedule_activity_teams_team_instance_event_fk" FOREIGN KEY ("team_instance_id","event_id") REFERENCES "public"."team_instances"("id","event_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_days" ADD CONSTRAINT "schedule_days_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "schedule_activities_day_id_planned_starts_at_idx" ON "schedule_activities" USING btree ("day_id","planned_starts_at");