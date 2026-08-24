CREATE TABLE "bracket_action_log" (
	"id" text PRIMARY KEY NOT NULL,
	"bracket_id" text NOT NULL,
	"match_id" text NOT NULL,
	"action" text NOT NULL,
	"winner_registration_id" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "bracket_action_log" ADD CONSTRAINT "bracket_action_log_bracket_id_bracket_id_fk" FOREIGN KEY ("bracket_id") REFERENCES "public"."bracket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_action_log" ADD CONSTRAINT "bracket_action_log_match_id_bracket_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."bracket_match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_action_log" ADD CONSTRAINT "bracket_action_log_winner_registration_id_tournament_registration_id_fk" FOREIGN KEY ("winner_registration_id") REFERENCES "public"."tournament_registration"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_action_log" ADD CONSTRAINT "bracket_action_log_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;