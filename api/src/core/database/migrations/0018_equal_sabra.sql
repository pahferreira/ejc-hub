CREATE TYPE "public"."experience_type" AS ENUM('newbie', 'experienced', 'coordinator');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_contact_phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "experience_type" "experience_type" DEFAULT 'experienced' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "emergency_contact_name";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "emergency_contact_phone";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "is_newbie";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "has_coordinator_experience";