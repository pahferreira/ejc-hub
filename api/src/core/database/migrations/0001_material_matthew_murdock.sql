ALTER TABLE "team_instances" DROP CONSTRAINT "team_instances_template_id_team_template_id_fk";
--> statement-breakpoint
ALTER TABLE "team_template" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "team_template" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "team_template" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team_instances" DROP COLUMN "template_id";