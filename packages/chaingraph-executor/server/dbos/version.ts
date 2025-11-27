/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * DBOS Application Version - HARDCODED
 *
 * CRITICAL: This version MUST match between:
 * - exe-api (enqueues workflows via DBOSClient)
 * - exe-worker (dequeues and executes workflows via DBOS runtime)
 *
 * When built from the same branch/commit, both services will use this constant.
 * DBOS dequeue query filters by: (application_version IS NULL OR application_version = $version)
 *
 * DO NOT use environment variables for this - hardcoding ensures consistency.
 */
export const DBOS_APPLICATION_VERSION = '1.0.0'

/**
 * DBOS Queue Name - HARDCODED
 *
 * The queue name used for workflow execution distribution.
 * Must match between API (enqueue) and Worker (dequeue).
 */
export const DBOS_QUEUE_NAME = 'chaingraph-executions'
