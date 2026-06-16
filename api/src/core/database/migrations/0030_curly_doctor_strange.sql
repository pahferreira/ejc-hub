CREATE TYPE "public"."team_assignment_audit_action" AS ENUM('assign', 'unassign', 'move', 'cancel');--> statement-breakpoint
CREATE TABLE "team_assignment_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"team_instance_id" uuid,
	"action" "team_assignment_audit_action" NOT NULL,
	"actor_id" uuid NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team_assignment_audit" ADD CONSTRAINT "team_assignment_audit_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_assignment_audit" ADD CONSTRAINT "team_assignment_audit_team_instance_id_team_instances_id_fk" FOREIGN KEY ("team_instance_id") REFERENCES "public"."team_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_assignment_audit" ADD CONSTRAINT "team_assignment_audit_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;