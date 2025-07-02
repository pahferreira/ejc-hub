ALTER TABLE "subscription_options" DROP CONSTRAINT "subscription_options_team_instance_id_team_instances_id_fk";
--> statement-breakpoint
ALTER TABLE "team_memberships" DROP CONSTRAINT "team_memberships_team_instance_id_team_instances_id_fk";
--> statement-breakpoint
ALTER TABLE "team_instances" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "team_instances" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "team_instances" ALTER COLUMN "template_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "team_instances" ALTER COLUMN "event_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_options" DROP COLUMN "team_instance_id";--> statement-breakpoint
ALTER TABLE "team_memberships" DROP COLUMN "team_instance_id";