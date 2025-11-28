/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { DBOSExecutionWorker } from '@badaitech/chaingraph-executor/server'
import http from 'node:http'
import process from 'node:process'
import { createServicesForWorker, config as executorConfig } from '@badaitech/chaingraph-executor/server'
import { config } from './config'
import { createLogger } from './logger'

const logger = createLogger('worker')

let executionWorker: DBOSExecutionWorker | null = null
let healthServer: http.Server | null = null
let isShuttingDown = false

/**
 * Get the worker ID from centralized config
 * Priority: WORKER_ID env > HOSTNAME (K8s pod name) > random
 */
const workerId = executorConfig.worker.id

/**
 * Start the DBOS execution worker
 *
 * This is a single-process worker that relies on DBOS for:
 * - Queue-based task distribution
 * - Concurrency control (workerConcurrency, globalConcurrency)
 * - Durable execution with automatic recovery
 * - Exactly-once semantics
 *
 * Multiple replicas can be deployed via Kubernetes for horizontal scaling.
 * DBOS handles work distribution automatically via PostgreSQL-backed queues.
 */
export async function startWorker(): Promise<void> {
  try {
    logger.info({ workerId }, '🚀 Starting DBOS execution worker')

    // Create services in Worker mode (full DBOS with queue dequeue)
    const services = await createServicesForWorker()

    if (!services.dbosWorker) {
      throw new Error('DBOS worker not initialized. Ensure ENABLE_DBOS_EXECUTION=true')
    }

    executionWorker = services.dbosWorker
    await executionWorker.start()

    logger.info({ workerId, pid: process.pid }, '✅ DBOS worker started (queue registered for dequeue)')

    // Start health server for Kubernetes liveness/readiness probes
    startHealthServer(workerId)

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    // Handle unexpected errors
    process.on('uncaughtException', (error) => {
      logger.error({ workerId, error }, 'Uncaught exception')
      gracefulShutdown('uncaughtException')
    })

    process.on('unhandledRejection', (error) => {
      logger.error({ workerId, error }, 'Unhandled rejection')
      gracefulShutdown('unhandledRejection')
    })
  } catch (error) {
    logger.error({ workerId, error }, 'Worker failed to start')
    process.exit(1)
  }
}

/**
 * Gracefully shutdown the worker
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown)
    return
  isShuttingDown = true

  logger.info({ workerId, signal }, 'Worker shutting down...')

  try {
    // Close health server first (stop accepting probes)
    if (healthServer) {
      healthServer.close()
      logger.debug('Health server closed')
    }

    // Stop DBOS worker (waits for in-progress workflows)
    if (executionWorker) {
      await executionWorker.stop()
      logger.debug('DBOS worker stopped')
    }

    logger.info({ workerId }, '✅ Worker stopped successfully')
    process.exit(0)
  } catch (error) {
    logger.error({ workerId, error }, 'Error during shutdown')
    process.exit(1)
  }
}

/**
 * Start HTTP health server for Kubernetes liveness/readiness probes
 *
 * Endpoints:
 * - GET /health - Returns worker health status
 * - GET /healthz - Alias for /health
 * - GET /ready - Readiness check
 */
function startHealthServer(workerId: string): void {
  const port = config.health.port

  healthServer = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/healthz' || req.url === '/ready') {
      const isHealthy = executionWorker?.isWorkerRunning() ?? false

      const health = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        workerId,
        pid: process.pid,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        dbosWorkerRunning: isHealthy,
      }

      const statusCode = isHealthy ? 200 : 503
      res.writeHead(statusCode, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(health))
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  })

  healthServer.listen(port, () => {
    logger.info({ port }, '📊 Health server started')
  })

  healthServer.on('error', (error) => {
    logger.error({ error, port }, 'Health server error')
  })
}
