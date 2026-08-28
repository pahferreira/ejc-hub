CREATE TYPE "public"."event_fee_payment_method" AS ENUM('pix', 'cash', 'credit_card', 'transfer', 'other');--> statement-breakpoint
CREATE TYPE "public"."event_fee_payment_status" AS ENUM('pending', 'not_paid', 'paid', 'exempt', 'refunded');--> statement-breakpoint
CREATE TABLE "event_fee_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "event_fee_payment_status" DEFAULT 'pending' NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"method" "event_fee_payment_method",
	"paid_at" timestamp,
	"notes" text,
	"recorded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_fee_payments_event_id_user_id_unique" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "fee_amount_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "fee_currency" text DEFAULT 'BRL' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_fee_payments" ADD CONSTRAINT "event_fee_payments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_fee_payments" ADD CONSTRAINT "event_fee_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_fee_payments" ADD CONSTRAINT "event_fee_payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_fee_payments_event_id_status_idx" ON "event_fee_payments" USING btree ("event_id","status");

-- ============================================================================
-- ROLLBACK (manual — not applied by drizzle-kit migrate).
-- Purely additive migration; nothing reads these objects until the Financial
-- feature ships, so this is safe to reverse.
-- Run these statements by hand, in order, against the target database.
-- ============================================================================
--
-- DROP TABLE "event_fee_payments";
-- DROP TYPE "public"."event_fee_payment_status";
-- DROP TYPE "public"."event_fee_payment_method";
-- ALTER TABLE "events" DROP COLUMN "fee_amount_cents";
-- ALTER TABLE "events" DROP COLUMN "fee_currency";
-- ============================================================================