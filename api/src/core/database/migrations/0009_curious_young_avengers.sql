ALTER TABLE "subscriptions" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "team_instances" ADD COLUMN "first_coordinator_id" uuid;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_instances" ADD CONSTRAINT "team_instances_first_coordinator_id_users_id_fk" FOREIGN KEY ("first_coordinator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;