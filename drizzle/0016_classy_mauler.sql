ALTER TYPE "public"."notification_type" ADD VALUE 'guild_invite';--> statement-breakpoint
ALTER TABLE "guild_invite" ADD COLUMN "recipient_id" text;--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "link" text;--> statement-breakpoint
ALTER TABLE "guild_invite" ADD CONSTRAINT "guild_invite_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;