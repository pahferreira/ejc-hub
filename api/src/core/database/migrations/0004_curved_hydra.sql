ALTER TABLE "team_instances" DROP CONSTRAINT "team_instances_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "team_instances" DROP COLUMN "event_id";