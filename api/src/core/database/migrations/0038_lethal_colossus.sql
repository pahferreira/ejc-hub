-- Custom SQL migration file, put your code below! --

-- Backfill coordinator membership rows from the (soon to be dropped) coordinator
-- FK columns on team_instances. Coordinators are a flat peer set — no slot/order.
-- Idempotent: guarded by NOT EXISTS so re-running this migration is a no-op.

INSERT INTO team_memberships (user_id, team_instance_id, type)
SELECT first_coordinator_id, id, 'coordinator' FROM team_instances
WHERE first_coordinator_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM team_memberships m WHERE m.team_instance_id = team_instances.id AND m.user_id = team_instances.first_coordinator_id);
--> statement-breakpoint

INSERT INTO team_memberships (user_id, team_instance_id, type)
SELECT second_coordinator_id, id, 'coordinator' FROM team_instances
WHERE second_coordinator_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM team_memberships m WHERE m.team_instance_id = team_instances.id AND m.user_id = team_instances.second_coordinator_id);
--> statement-breakpoint

INSERT INTO team_memberships (user_id, team_instance_id, type)
SELECT third_coordinator_id, id, 'coordinator' FROM team_instances
WHERE third_coordinator_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM team_memberships m WHERE m.team_instance_id = team_instances.id AND m.user_id = team_instances.third_coordinator_id);
