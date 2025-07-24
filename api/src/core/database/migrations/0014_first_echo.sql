ALTER TABLE "subscription_options" DROP CONSTRAINT "subscription_options_subscription_id_subscriptions_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription_options" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "subscription_options" DROP COLUMN "subscription_id";