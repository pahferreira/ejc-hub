CREATE TYPE "public"."meeting_attendance_status" AS ENUM('present', 'absent', 'justified');--> statement-breakpoint
CREATE TABLE "meeting_attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "meeting_attendance_status" NOT NULL,
	"justification_reason" text,
	CONSTRAINT "meeting_attendances_meeting_id_user_id_unique" UNIQUE("meeting_id","user_id"),
	CONSTRAINT "meeting_attendances_justification_reason_check" CHECK (("meeting_attendances"."status" = 'justified' AND coalesce(btrim("meeting_attendances"."justification_reason"), '') <> '') OR ("meeting_attendances"."status" <> 'justified' AND "meeting_attendances"."justification_reason" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_instance_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"held_on" date NOT NULL,
	"title" text,
	"description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting_attendances" ADD CONSTRAINT "meeting_attendances_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_attendances" ADD CONSTRAINT "meeting_attendances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_team_instance_event_fk" FOREIGN KEY ("team_instance_id","event_id") REFERENCES "public"."team_instances"("id","event_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meeting_attendances_user_id_idx" ON "meeting_attendances" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meetings_team_instance_id_held_on_idx" ON "meetings" USING btree ("team_instance_id","held_on");