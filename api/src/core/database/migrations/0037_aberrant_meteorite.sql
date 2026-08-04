CREATE TYPE "public"."team_membership_type" AS ENUM('member', 'coordinator');--> statement-breakpoint
ALTER TABLE "team_memberships" ADD COLUMN "type" "team_membership_type" DEFAULT 'member' NOT NULL;