CREATE TYPE "public"."subscription_availability" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('pending', 'received', 'completed', 'waiting_list');--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_options" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text,
	"team_instance_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"emergency_contact_name" text NOT NULL,
	"emergency_contact_phone" text NOT NULL,
	"is_newbie" boolean DEFAULT false NOT NULL,
	"status" "subscription_status" DEFAULT 'pending' NOT NULL,
	"availability" "subscription_availability"[] DEFAULT '{}',
	"has_coordinator_experience" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_instances" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text,
	"event_id" text,
	"first_coordinator_id" text,
	"second_coordinator_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"team_instance_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_template" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"name" text NOT NULL,
	"nickname" text NOT NULL,
	"date_of_birth" timestamp NOT NULL,
	"has_music_skills" boolean DEFAULT false NOT NULL,
	"has_acting_skills" boolean DEFAULT false NOT NULL,
	"has_dancing_skills" boolean DEFAULT false NOT NULL,
	"has_singing_skills" boolean DEFAULT false NOT NULL,
	"has_manual_skills" boolean DEFAULT false NOT NULL,
	"has_cooking_skills" boolean DEFAULT false NOT NULL,
	"has_communication_skills" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription_options" ADD CONSTRAINT "subscription_options_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_options" ADD CONSTRAINT "subscription_options_team_instance_id_team_instances_id_fk" FOREIGN KEY ("team_instance_id") REFERENCES "public"."team_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_instances" ADD CONSTRAINT "team_instances_template_id_team_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."team_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_instances" ADD CONSTRAINT "team_instances_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_instances" ADD CONSTRAINT "team_instances_first_coordinator_id_users_id_fk" FOREIGN KEY ("first_coordinator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_instances" ADD CONSTRAINT "team_instances_second_coordinator_id_users_id_fk" FOREIGN KEY ("second_coordinator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_instance_id_team_instances_id_fk" FOREIGN KEY ("team_instance_id") REFERENCES "public"."team_instances"("id") ON DELETE no action ON UPDATE no action;