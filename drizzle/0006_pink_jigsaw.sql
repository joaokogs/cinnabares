CREATE TYPE "public"."tournament_registration_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."tournament_format" AS ENUM('individual', 'guild');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('draft', 'open', 'closed', 'finished');--> statement-breakpoint
CREATE TYPE "public"."tournament_tier" AS ENUM('overused', 'underused', 'neverused', 'doubles', 'random');--> statement-breakpoint
CREATE TYPE "public"."tournament_visibility" AS ENUM('blind', 'partial', 'total');--> statement-breakpoint
CREATE TABLE "tournament" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"format" "tournament_format" NOT NULL,
	"tiers" jsonb NOT NULL,
	"tier_rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"slots" integer NOT NULL,
	"visibility" "tournament_visibility" DEFAULT 'blind' NOT NULL,
	"status" "tournament_status" DEFAULT 'draft' NOT NULL,
	"team_size" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_registration" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"user_id" text,
	"guild_id" text,
	"status" "tournament_registration_status" DEFAULT 'pending' NOT NULL,
	"roster" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_registration_user_unique" UNIQUE("tournament_id","user_id"),
	CONSTRAINT "tournament_registration_guild_unique" UNIQUE("tournament_id","guild_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament" ADD CONSTRAINT "tournament_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_registration" ADD CONSTRAINT "tournament_registration_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_registration" ADD CONSTRAINT "tournament_registration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_registration" ADD CONSTRAINT "tournament_registration_guild_id_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guild"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_registration" ADD CONSTRAINT "tournament_registration_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;