CREATE TABLE "chaingraph_external_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"external_email" text,
	"display_name" text,
	"avatar_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chaingraph_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"display_name" text,
	"avatar_url" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	"metadata" jsonb
);
ALTER TABLE "chaingraph_external_accounts" ADD CONSTRAINT "chaingraph_external_accounts_user_id_chaingraph_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."chaingraph_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "external_accounts_user_id_idx" ON "chaingraph_external_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_accounts_provider_external_id_idx" ON "chaingraph_external_accounts" USING btree ("provider","external_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "chaingraph_users" USING btree ("email");