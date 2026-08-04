ALTER TABLE "team_instances" DROP CONSTRAINT "team_instances_first_coordinator_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "team_instances" DROP CONSTRAINT "team_instances_second_coordinator_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "team_instances" DROP CONSTRAINT "team_instances_third_coordinator_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "team_instances" DROP COLUMN "first_coordinator_id";--> statement-breakpoint
ALTER TABLE "team_instances" DROP COLUMN "second_coordinator_id";--> statement-breakpoint
ALTER TABLE "team_instances" DROP COLUMN "third_coordinator_id";--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_instance_id_user_id_unique" UNIQUE("team_instance_id","user_id");

-- ============================================================================
-- ROLLBACK (manual — not applied by drizzle-kit migrate).
-- Reverses this migration AND the 0038 backfill AND the 0037 column add, in one
-- script, restoring the pre-unification coordinator-FK-column model.
-- Coordinators were a flat set here, so first/second/third are reassigned by
-- created_at order (best-effort — the original slot order was not persisted).
-- Run these statements by hand, in order, against the target database.
-- ============================================================================
--
-- -- 1. Recreate the 3 coordinator FK columns on team_instances.
-- ALTER TABLE "team_instances" ADD COLUMN "first_coordinator_id" uuid REFERENCES "users"("id");
-- ALTER TABLE "team_instances" ADD COLUMN "second_coordinator_id" uuid REFERENCES "users"("id");
-- ALTER TABLE "team_instances" ADD COLUMN "third_coordinator_id" uuid REFERENCES "users"("id");
--
-- -- 2. Repopulate them from the coordinator membership rows (created_at order → columns 1/2/3).
-- WITH ranked AS (
--   SELECT user_id, team_instance_id,
--          row_number() OVER (PARTITION BY team_instance_id ORDER BY created_at) AS rn
--   FROM "team_memberships" WHERE type = 'coordinator'
-- )
-- UPDATE "team_instances" ti SET
--   "first_coordinator_id"  = (SELECT user_id FROM ranked WHERE ranked.team_instance_id = ti.id AND rn = 1),
--   "second_coordinator_id" = (SELECT user_id FROM ranked WHERE ranked.team_instance_id = ti.id AND rn = 2),
--   "third_coordinator_id"  = (SELECT user_id FROM ranked WHERE ranked.team_instance_id = ti.id AND rn = 3);
--
-- -- 3. Drop the unique constraint added by this migration (0039).
-- ALTER TABLE "team_memberships" DROP CONSTRAINT "team_memberships_team_instance_id_user_id_unique";
--
-- -- 4. Delete the coordinator membership rows (now redundant with the FK columns).
-- DELETE FROM "team_memberships" WHERE "type" = 'coordinator';
--
-- -- 5. Drop the column/enum added by 0037.
-- ALTER TABLE "team_memberships" DROP COLUMN "type";
-- DROP TYPE "public"."team_membership_type";
-- ============================================================================