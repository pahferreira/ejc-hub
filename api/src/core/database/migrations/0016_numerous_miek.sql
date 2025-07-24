ALTER TABLE "subscription_options" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "subscription_options" ALTER COLUMN "subscription_id" SET DATA TYPE uuid;