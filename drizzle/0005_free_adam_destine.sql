CREATE TABLE "guild_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"created_by" text NOT NULL,
	"token" text NOT NULL,
	"uses" integer DEFAULT 0 NOT NULL,
	"max_uses" integer,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guild_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "guild_invite" ADD CONSTRAINT "guild_invite_guild_id_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guild"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_invite" ADD CONSTRAINT "guild_invite_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;