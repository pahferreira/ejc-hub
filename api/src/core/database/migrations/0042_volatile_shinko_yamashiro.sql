-- Hand-ordered. drizzle-kit generated ADD COLUMN ... NOT NULL in a single
-- statement (fails on existing rows) and placed the composite FK before the
-- unique it references. The statements below are the same schema change,
-- sequenced so it applies to a populated database.

-- 1. Resolve pre-existing duplicates: a user holding memberships in two teams of
--    the same event. Coordinator rows win — the coordinator drawer is the more
--    deliberate assignment; a stray member row is the accidental leftover.
DELETE FROM "team_memberships" tm
USING "team_instances" ti
WHERE ti."id" = tm."team_instance_id"
  AND tm."type" = 'member'
  AND EXISTS (
    SELECT 1 FROM "team_memberships" c
    JOIN "team_instances" cti ON cti."id" = c."team_instance_id"
    WHERE c."user_id" = tm."user_id"
      AND cti."event_id" = ti."event_id"
      AND c."type" = 'coordinator'
  );
--> statement-breakpoint
-- 2. The composite FK below subsumes this single-column one.
ALTER TABLE "team_memberships" DROP CONSTRAINT "team_memberships_team_instance_id_team_instances_id_fk";
--> statement-breakpoint
-- 3. FK target must be unique before it can be referenced.
ALTER TABLE "team_instances" ADD CONSTRAINT "team_instances_id_event_id_unique" UNIQUE("id","event_id");
--> statement-breakpoint
-- 4. Add nullable, backfill, then tighten.
ALTER TABLE "team_memberships" ADD COLUMN "event_id" uuid;
--> statement-breakpoint
UPDATE "team_memberships" tm
   SET "event_id" = ti."event_id"
  FROM "team_instances" ti
 WHERE ti."id" = tm."team_instance_id";
--> statement-breakpoint
ALTER TABLE "team_memberships" ALTER COLUMN "event_id" SET NOT NULL;
--> statement-breakpoint
-- 5. Ties event_id to the team instance's own event, so the denormalized column
--    cannot drift.
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_instance_event_fk" FOREIGN KEY ("team_instance_id","event_id") REFERENCES "public"."team_instances"("id","event_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
-- 6. One membership per user per event, members and coordinators alike.
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_event_id_user_id_unique" UNIQUE("event_id","user_id");

-- ============================================================================
-- ROLLBACK (manual — not applied by drizzle-kit migrate).
-- Restores the pre-0042 shape. The rows deleted by step 1 are NOT recoverable;
-- take a backup of team_memberships before migrating if that matters.
-- Run these statements by hand, in order, against the target database.
-- ============================================================================
--
-- -- 1. Drop the constraints added by this migration.
-- ALTER TABLE "team_memberships" DROP CONSTRAINT "team_memberships_event_id_user_id_unique";
-- ALTER TABLE "team_memberships" DROP CONSTRAINT "team_memberships_team_instance_event_fk";
-- ALTER TABLE "team_instances" DROP CONSTRAINT "team_instances_id_event_id_unique";
--
-- -- 2. Drop the denormalized column.
-- ALTER TABLE "team_memberships" DROP COLUMN "event_id";
--
-- -- 3. Restore the single-column FK the composite one replaced.
-- ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_instance_id_team_instances_id_fk"
--   FOREIGN KEY ("team_instance_id") REFERENCES "public"."team_instances"("id") ON DELETE no action ON UPDATE no action;
-- ============================================================================
