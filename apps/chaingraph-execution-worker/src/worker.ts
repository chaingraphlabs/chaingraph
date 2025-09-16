/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import { createServices, ExecutionWorker } from '@badaitech/chaingraph-executor/server'
import { config } from './config'
import { createLogger } from './logger'

const logger = createLogger('worker')

let executionWorker: ExecutionWorker | null = null
let isShuttingDown = false

export async function startWorker(): Promise<void> {
  const workerId = process.env.WORKER_ID || `worker-${process.pid}`

  try {
    // Set environment variables for the executor package
    process.env.EXECUTION_MODE = config.executionMode
    process.env.DATABASE_URL = config.databaseUrl
    process.env.KAFKA_BROKERS = config.kafka.brokers.join(',')
    process.env.WORKER_ID = workerId

    // Create services (EventBus, TaskQueue, ExecutionStore)
    const services = await createServices()

    // Create and start the execution worker
    executionWorker = new ExecutionWorker(
      services.executionStore,
      services.eventBus,
      services.taskQueue,
    )

    await executionWorker.start()

    logger.info({ workerId, pid: process.pid }, '✅ Worker started successfully')

    // Send heartbeat to master
    setInterval(() => {
      if (process.send) {
        process.send({ type: 'heartbeat', workerId, timestamp: Date.now() })
      }
    }, config.monitoring.heartbeatInterval)

    // Handle shutdown message from master
    process.on('message', async (msg: any) => {
      if (msg.type === 'shutdown') {
        await gracefulShutdown()
      }
    })

    // Handle unexpected errors
    process.on('uncaughtException', (error) => {
      logger.error({ workerId, error }, 'Worker uncaught exception')
      process.exit(1)
    })

    process.on('unhandledRejection', (error) => {
      logger.error({ workerId, error }, 'Worker unhandled rejection')
      process.exit(1)
    })
  } catch (error) {
    logger.error({ workerId, error }, 'Worker failed to start')
    process.exit(1)
  }
}

async function gracefulShutdown(): Promise<void> {
  if (isShuttingDown)
    return
  isShuttingDown = true

  const workerId = process.env.WORKER_ID
  logger.info({ workerId }, 'Worker shutting down gracefully...')

  try {
    if (executionWorker) {
      await executionWorker.stop()
    }
    logger.info({ workerId }, 'Worker stopped successfully')
    process.exit(0)
  } catch (error) {
    logger.error({ workerId, error }, 'Worker error during shutdown')
    process.exit(1)
  }
}
