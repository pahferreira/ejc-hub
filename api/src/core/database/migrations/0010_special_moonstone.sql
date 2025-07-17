ALTER TABLE "team_memberships" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "team_memberships" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();