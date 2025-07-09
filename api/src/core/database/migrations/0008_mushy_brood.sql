ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "team_instances" DROP CONSTRAINT "team_instances_first_coordinator_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "team_instances" DROP CONSTRAINT "team_instances_second_coordinator_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "team_memberships" DROP CONSTRAINT "team_memberships_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "nickname" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "date_of_birth" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "picture_url" text;--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "team_instances" DROP COLUMN "first_coordinator_id";--> statement-breakpoint
ALTER TABLE "team_instances" DROP COLUMN "second_coordinator_id";--> statement-breakpoint
ALTER TABLE "team_memberships" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");