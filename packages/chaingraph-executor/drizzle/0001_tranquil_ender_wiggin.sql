CREATE TABLE "chaingraph_execution_recovery" (
	"id" serial PRIMARY KEY NOT NULL,
	"execution_id" text NOT NULL,
	"recovered_at" timestamp DEFAULT now() NOT NULL,
	"recovered_by_worker" text NOT NULL,
	"recovery_reason" text NOT NULL,
	"previous_status" text,
	"previous_worker_id" text
);
--> statement-breakpoint
ALTER TABLE "chaingraph_executions" ADD COLUMN "failure_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chaingraph_executions" ADD COLUMN "last_failure_reason" text;--> statement-breakpoint
ALTER TABLE "chaingraph_executions" ADD COLUMN "last_failure_at" timestamp;--> statement-breakpoint
ALTER TABLE "chaingraph_executions" ADD COLUMN "processing_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "chaingraph_executions" ADD COLUMN "processing_worker_id" text;--> statement-breakpoint
ALTER TABLE "chaingraph_execution_recovery" ADD CONSTRAINT "chaingraph_execution_recovery_execution_id_chaingraph_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."chaingraph_executions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "execution_recovery_execution_id_idx" ON "chaingraph_execution_recovery" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "execution_recovery_recovered_at_idx" ON "chaingraph_execution_recovery" USING btree ("recovered_at");--> statement-breakpoint
CREATE INDEX "execution_recovery_worker_idx" ON "chaingraph_execution_recovery" USING btree ("recovered_by_worker");/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

--> statement-breakpoint
CREATE INDEX "execution_recovery_reason_idx" ON "chaingraph_execution_recovery" USING btree ("recovery_reason");--> statement-breakpoint
CREATE INDEX "executions_failure_count_idx" ON "chaingraph_executions" USING btree ("failure_count");--> statement-breakpoint
CREATE INDEX "executions_processing_worker_idx" ON "chaingraph_executions" USING btree ("processing_worker_id");--> statement-breakpoint
CREATE INDEX "executions_status_failure_idx" ON "chaingraph_executions" USING btree ("status","failure_count");--> statement-breakpoint
CREATE INDEX "executions_last_failure_at_idx" ON "chaingraph_executions" USING btree ("last_failure_at");