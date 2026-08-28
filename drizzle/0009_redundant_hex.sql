ALTER TABLE "tournament" ADD COLUMN "scheduled_date" date NOT NULL DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "scheduled_time" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "location" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "reward" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "scheduled_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "scheduled_time" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "location" DROP DEFAULT;
