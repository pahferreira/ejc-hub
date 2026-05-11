ALTER TABLE "events" ADD COLUMN "starts_at" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "location" text;