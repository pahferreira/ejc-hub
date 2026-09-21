-- Hand-edited to add the backfill. drizzle-kit emits only the CREATE TYPE and the
-- ADD COLUMN; the DEFAULT then fills every existing row with 'open', which is wrong
-- for any event whose subscriptions were already closed.
--
-- subscriptions_open is left in place here only so the backfill above can read
-- it. This is NOT an expand/contract rollout: 0047 drops the column and ships in
-- the same batch, so drizzle-kit applies both in one pass. Between 0047's commit
-- and the container flip the old image is still serving and every events query it
-- runs names a column that no longer exists. Accepted deliberately — see 0047.

CREATE TYPE "public"."event_subscription_mode" AS ENUM('open', 'waiting_list', 'closed');--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "subscription_mode" "event_subscription_mode" DEFAULT 'open' NOT NULL;--> statement-breakpoint
-- Map the old boolean before anything reads the new column. There is no
-- waiting_list equivalent to migrate from — it is a new state.
UPDATE "events" SET "subscription_mode" = 'closed' WHERE "subscriptions_open" = false;

-- ============================================================================
-- ROLLBACK (manual — not applied by drizzle-kit migrate).
-- Reverse 0047 FIRST (it runs immediately after this one), otherwise dropping
-- subscription_mode loses the only record of which events were closed.
-- Run these statements by hand, in order, against the target database.
-- ============================================================================
--
-- ALTER TABLE "events" DROP COLUMN "subscription_mode";
-- DROP TYPE "public"."event_subscription_mode";
-- ============================================================================
