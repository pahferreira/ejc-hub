ALTER TABLE "team_template" RENAME TO "team_templates";--> statement-breakpoint
ALTER TABLE "team_templates" DROP CONSTRAINT "team_template_key_unique";--> statement-breakpoint
ALTER TABLE "team_instances" DROP CONSTRAINT "team_instances_template_id_team_template_id_fk";
--> statement-breakpoint
ALTER TABLE "team_instances" ADD CONSTRAINT "team_instances_template_id_team_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."team_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_templates" ADD CONSTRAINT "team_templates_key_unique" UNIQUE("key");