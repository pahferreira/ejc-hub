ALTER TABLE "subscriptions" ADD COLUMN "details" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "previous_experience_teams" text[] DEFAULT '{}';