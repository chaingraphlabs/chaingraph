ALTER TABLE "chaingraph_executions" ADD COLUMN "root_execution_id" text;/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

--> statement-breakpoint
ALTER TABLE "chaingraph_executions" ADD CONSTRAINT "chaingraph_executions_root_execution_id_chaingraph_executions_id_fk" FOREIGN KEY ("root_execution_id") REFERENCES "public"."chaingraph_executions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chaingraph_executions" ADD CONSTRAINT "chaingraph_executions_parent_execution_id_chaingraph_executions_id_fk" FOREIGN KEY ("parent_execution_id") REFERENCES "public"."chaingraph_executions"("id") ON DELETE no action ON UPDATE no action;