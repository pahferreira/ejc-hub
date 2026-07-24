ALTER TABLE "subscriptions" ADD COLUMN "already_worked_here" boolean;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "already_worked_event" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "already_worked_teams" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "groups" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "already_worked_here" boolean;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "already_worked_event" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "already_worked_teams" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "groups" text;