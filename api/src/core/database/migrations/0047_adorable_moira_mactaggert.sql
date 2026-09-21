-- Ships in the same batch as 0046, so there is no version-overlap safety here:
-- drizzle-kit runs this before the deploy flips the container (see deploy-api.yml),
-- and the still-running old image reads events.subscriptions_open on every events
-- query. That leaves a window of roughly a minute where those routes 500.
--
-- Accepted knowingly: single-instance deploy that already cuts over hard, ~50
-- daily active users. If this app ever grows a rolling deploy or a second
-- instance, split a drop like this into the release after the one that adds its
-- replacement.

ALTER TABLE "events" DROP COLUMN "subscriptions_open";

-- ============================================================================
-- ROLLBACK (manual — not applied by drizzle-kit migrate).
-- The second statement is NOT optional. Recreating the column with its old
-- DEFAULT true would reopen every closed event, because the default cannot know
-- which ones were closed — only subscription_mode still holds that.
-- 'waiting_list' maps back to true: subscriptions were open in that mode, the
-- resulting status was simply different, and the old boolean cannot express it.
-- Run these statements by hand, in order, against the target database.
-- ============================================================================
--
-- ALTER TABLE "events" ADD COLUMN "subscriptions_open" boolean DEFAULT true NOT NULL;
-- UPDATE "events" SET "subscriptions_open" = ("subscription_mode" <> 'closed');
-- ============================================================================
