CREATE TABLE IF NOT EXISTS "chaingraph_execution_events" (
	"execution_id" text NOT NULL,
	"event_index" integer NOT NULL,
	"event_type" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "chaingraph_execution_events_execution_id_event_index_pk" PRIMARY KEY("execution_id","event_index")
);
/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chaingraph_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"flow_id" text NOT NULL,
	"owner_id" text,
	"parent_execution_id" text,
	"status" text NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "execution_events_execution_id_timestamp_idx" ON "chaingraph_execution_events" USING btree ("execution_id","timestamp");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "execution_events_execution_id_event_type_idx" ON "chaingraph_execution_events" USING btree ("execution_id","event_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "executions_owner_id_created_at_idx" ON "chaingraph_executions" USING btree ("owner_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "executions_parent_execution_id_idx" ON "chaingraph_executions" USING btree ("parent_execution_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "executions_flow_id_idx" ON "chaingraph_executions" USING btree ("flow_id");