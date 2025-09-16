CREATE TABLE "chaingraph_execution_claims" (
	"execution_id" text PRIMARY KEY NOT NULL,
	"worker_id" text NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"heartbeat_at" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chaingraph_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"flow_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"root_execution_id" text,
	"parent_execution_id" text,
	"status" text DEFAULT 'created' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"error_node_id" text,
	"execution_depth" integer DEFAULT 0 NOT NULL,
	"options" jsonb,
	"integration" jsonb,
	"external_events" jsonb
);
--> statement-breakpoint
CREATE INDEX "execution_claims_worker_id_idx" ON "chaingraph_execution_claims" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "execution_claims_expires_at_idx" ON "chaingraph_execution_claims" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "execution_claims_status_idx" ON "chaingraph_execution_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "execution_claims_expires_at_status_idx" ON "chaingraph_execution_claims" USING btree ("expires_at","status");--> statement-breakpoint
CREATE INDEX "executions_flow_depth_created_idx" ON "chaingraph_executions" USING btree ("flow_id","execution_depth","created_at");--> statement-breakpoint
CREATE INDEX "executions_root_execution_id_idx" ON "chaingraph_executions" USING btree ("root_execution_id");--> statement-breakpoint
CREATE INDEX "executions_parent_execution_id_idx" ON "chaingraph_executions" USING btree ("parent_execution_id");--> statement-breakpoint
CREATE INDEX "executions_flow_id_idx" ON "chaingraph_executions" USING btree ("flow_id");/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

--> statement-breakpoint
CREATE INDEX "executions_status_idx" ON "chaingraph_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "executions_started_at_idx" ON "chaingraph_executions" USING btree ("started_at");