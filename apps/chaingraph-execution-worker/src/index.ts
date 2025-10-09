/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import cluster from 'node:cluster'
import process from 'node:process'
import { createTopicsIfNotExist } from '@badaitech/chaingraph-executor/server'
import { config } from './config'
import { logger } from './logger'
import { startMaster } from './master'
import { startWorker } from './worker'

// Determine if this is the master process or a worker
async function main() {
  const isDBOSEnabled = process.env.ENABLE_DBOS_EXECUTION === 'true'

  // DBOS mode: Run as single process (no cluster)
  // DBOS handles concurrency internally and conflicts with Node.js cluster mode
  if (isDBOSEnabled) {
    logger.info('🚀 Starting Chaingraph Execution Worker Service (DBOS Mode - Single Process)')
    logger.info({
      pid: process.pid,
      mode: 'DBOS',
      dbosWorkerConcurrency: process.env.DBOS_WORKER_CONCURRENCY || '5',
      dbosQueueConcurrency: process.env.DBOS_QUEUE_CONCURRENCY || '100',
    }, 'Service configuration')

    // IMPORTANT: Create Kafka topics for events (DBOS uses Kafka for event streaming)
    // Even though DBOS handles tasks, we still use Kafka for real-time events
    if (config.executionMode === 'distributed') {
      logger.info('Creating Kafka topics for event streaming (hybrid DBOS architecture)')
      await createTopicsIfNotExist()
    }

    // Start single worker process (no clustering)
    await startWorker()
    return
  }

  // Traditional Kafka mode: Use cluster with multiple workers
  if (cluster.isPrimary) {
    logger.info('🚀 Starting Chaingraph Execution Worker Service (Kafka Mode - Cluster)')
    logger.info({
      masterPid: process.pid,
      workers: config.workers.count,
      mode: config.executionMode,
    }, 'Service configuration')

    // Create Kafka topics if in distributed mode
    if (config.executionMode === 'distributed') {
      logger.info('Creating Kafka topics if they don\'t exist')
      await createTopicsIfNotExist()
    }

    startMaster()
  } else {
    // This is a worker process spawned by cluster
    await startWorker()
  }
}

main().catch((error) => {
  logger.error({ error }, 'Failed to start service')
  process.exit(1)
})
