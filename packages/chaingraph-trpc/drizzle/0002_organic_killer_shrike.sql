CREATE TABLE "chaingraph_mcp_servers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"auth_headers" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

--> statement-breakpoint
CREATE INDEX "mcp_servers_user_id_idx" ON "chaingraph_mcp_servers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mcp_servers_user_id_updated_at_idx" ON "chaingraph_mcp_servers" USING btree ("user_id","updated_at");