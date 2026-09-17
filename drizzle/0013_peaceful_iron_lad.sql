ALTER TABLE "post_comment" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "post_pokemon" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "post_comment" ADD CONSTRAINT "post_comment_parent_id_post_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."post_comment"("id") ON DELETE cascade ON UPDATE no action;