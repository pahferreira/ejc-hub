ALTER TABLE "users"
  ADD COLUMN "has_coordinator_experience" boolean NOT NULL DEFAULT false;
--> statement-breakpoint

UPDATE "users"
  SET "has_coordinator_experience" = true
  WHERE "experience_type" = 'coordinator';
--> statement-breakpoint

ALTER TYPE "public"."experience_type" RENAME TO "experience_type_old";
--> statement-breakpoint

CREATE TYPE "public"."experience_type" AS ENUM('newbie', 'experienced', 'experienced_outsider');
--> statement-breakpoint

ALTER TABLE "users"
  ALTER COLUMN "experience_type" DROP DEFAULT;
--> statement-breakpoint

ALTER TABLE "users"
  ALTER COLUMN "experience_type" TYPE "public"."experience_type"
  USING (
    CASE "experience_type"::text
      WHEN 'coordinator' THEN 'experienced'
      ELSE "experience_type"::text
    END
  )::"public"."experience_type";
--> statement-breakpoint

ALTER TABLE "users"
  ALTER COLUMN "experience_type" SET DEFAULT 'experienced';
--> statement-breakpoint

DROP TYPE "public"."experience_type_old";
