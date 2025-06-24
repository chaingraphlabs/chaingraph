ALTER TABLE "chaingraph_executions" ADD COLUMN "error_message" text;/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

--> statement-breakpoint
ALTER TABLE "chaingraph_executions" ADD COLUMN "error_node_id" text;--> statement-breakpoint
ALTER TABLE "chaingraph_executions" ADD COLUMN "execution_depth" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chaingraph_executions" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "chaingraph_executions" ADD COLUMN "external_events" jsonb;--> statement-breakpoint
CREATE INDEX "executions_status_idx" ON "chaingraph_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "executions_started_at_idx" ON "chaingraph_executions" USING btree ("started_at");