CREATE TABLE "chaingraph_execution_claims" (
	"execution_id" text PRIMARY KEY NOT NULL,
	"worker_id" text NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"heartbeat_at" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL
);
/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

--> statement-breakpoint
CREATE INDEX "execution_claims_worker_id_idx" ON "chaingraph_execution_claims" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "execution_claims_expires_at_idx" ON "chaingraph_execution_claims" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "execution_claims_status_idx" ON "chaingraph_execution_claims" USING btree ("status");