/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import { config } from './config'
import { logger } from './logger'
import { startWorker } from './worker'

// Start the execution worker service
// DBOS mode: Run as single process (no cluster)
// DBOS handles concurrency internally via its queue system
async function main() {
  logger.info('🚀 Starting Chaingraph Execution Worker Service (DBOS Mode)')
  logger.info({
    pid: process.pid,
    mode: config.executionMode,
    dbosWorkerConcurrency: process.env.DBOS_WORKER_CONCURRENCY || '5',
    dbosQueueConcurrency: process.env.DBOS_QUEUE_CONCURRENCY || '100',
  }, 'Service configuration')

  // Start worker process
  await startWorker()
}

main().catch((error) => {
  logger.error({ error }, 'Failed to start service')
  process.exit(1)
})
