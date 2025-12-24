/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import { init } from '@badaitech/chaingraph-trpc/server'
import { logger } from './logger'
import { startWorker } from './worker'

/**
 * Chaingraph Execution Worker
 *
 * Single-process worker that uses DBOS for durable workflow execution.
 * DBOS handles concurrency control and work distribution via PostgreSQL-backed queues.
 *
 * For horizontal scaling, deploy multiple replicas via Kubernetes.
 * Each replica registers with the same DBOS queue and picks up work automatically.
 *
 * Environment variables:
 * - ENABLE_DBOS_EXECUTION=true (required)
 * - DATABASE_URL_EXECUTIONS - PostgreSQL connection for DBOS
 * - DBOS_WORKER_CONCURRENCY - Max concurrent workflows per worker (default: 5)
 * - DBOS_QUEUE_CONCURRENCY - Global max concurrent workflows (default: 100)
 * - HEALTH_PORT - Health endpoint port (default: 9090)
 */
async function main() {
  logger.info('🚀 Starting Chaingraph Execution Worker')
  logger.info({
    pid: process.pid,
    nodeVersion: process.version,
    dbosWorkerConcurrency: process.env.DBOS_WORKER_CONCURRENCY || '5',
    dbosQueueConcurrency: process.env.DBOS_QUEUE_CONCURRENCY || '100',
  }, 'Worker configuration')

  // Initialize tRPC/auth dependencies
  await init({
    useFlowStoreCache: false, // There is internal flow caching in the executor DBOS workflow
  })

  // Start the DBOS worker
  await startWorker()
}

main().catch((error) => {
  logger.error({ error }, 'Failed to start worker')
  process.exit(1)
})
