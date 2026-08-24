ALTER TYPE "tournament_status" ADD VALUE IF NOT EXISTS 'active';--> statement-breakpoint
CREATE TYPE "bracket_match_status" AS ENUM('pending', 'completed');--> statement-breakpoint
CREATE TABLE "bracket" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bracket_tournament_unique" UNIQUE("tournament_id")
);--> statement-breakpoint
CREATE TABLE "bracket_match" (
	"id" text PRIMARY KEY NOT NULL,
	"bracket_id" text NOT NULL,
	"phase" integer NOT NULL,
	"position" integer NOT NULL,
	"slot1_registration_id" text,
	"slot2_registration_id" text,
	"winner_registration_id" text,
	"status" "bracket_match_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bracket_match_bracket_phase_position_unique" UNIQUE("bracket_id","phase","position")
);--> statement-breakpoint
ALTER TABLE "bracket" ADD CONSTRAINT "bracket_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_match" ADD CONSTRAINT "bracket_match_bracket_id_bracket_id_fk" FOREIGN KEY ("bracket_id") REFERENCES "public"."bracket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_match" ADD CONSTRAINT "bracket_match_slot1_registration_id_tournament_registration_id_fk" FOREIGN KEY ("slot1_registration_id") REFERENCES "public"."tournament_registration"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_match" ADD CONSTRAINT "bracket_match_slot2_registration_id_tournament_registration_id_fk" FOREIGN KEY ("slot2_registration_id") REFERENCES "public"."tournament_registration"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_match" ADD CONSTRAINT "bracket_match_winner_registration_id_tournament_registration_id_fk" FOREIGN KEY ("winner_registration_id") REFERENCES "public"."tournament_registration"("id") ON DELETE set null ON UPDATE no action;
