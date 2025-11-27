/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { DBOS, WorkflowQueue } from '@dbos-inc/dbos-sdk'
import { config } from '../utils/config'
import { createLogger } from '../utils/logger'

const logger = createLogger('dbos-queue')

export const QUEUE_NAME = 'chaingraph-executions'

// CRITICAL: Check if DBOS is already initialized
// If true, the queue won't be registered for dequeue!
const dbosAlreadyInitialized = DBOS.isInitialized()
if (dbosAlreadyInitialized) {
  logger.error('CRITICAL: DBOS is already initialized! Queue will NOT be used for dequeue!')
}

/**
 * Module-level workflow queue for chaingraph executions
 *
 * CRITICAL: This must be created BEFORE DBOS.launch() for the worker to dequeue tasks.
 * If created after DBOS.launch(), the queue will only be used for enqueueing (not dequeueing).
 *
 * The queue is exported at module level so it's created during module load,
 * which happens before DBOS.launch() is called.
 */
export const executionQueue = new WorkflowQueue(QUEUE_NAME, {
  workerConcurrency: config.dbos.workerConcurrency ?? 5,
  concurrency: config.dbos.queueConcurrency ?? 100,
})

// Log at INFO level so it's visible in production logs
// This helps verify the queue was created before DBOS.launch()
logger.info({
  queueName: QUEUE_NAME,
  workerConcurrency: config.dbos.workerConcurrency ?? 5,
  concurrency: config.dbos.queueConcurrency ?? 100,
  dbosInitializedBeforeQueueCreation: dbosAlreadyInitialized,
}, 'Execution queue created at module level (BEFORE DBOS.launch)')
