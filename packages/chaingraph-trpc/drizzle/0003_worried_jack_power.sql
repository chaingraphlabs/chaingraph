/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

CREATE INDEX "execution_events_execution_id_event_index_idx" ON "chaingraph_execution_events" USING btree ("execution_id","event_index");