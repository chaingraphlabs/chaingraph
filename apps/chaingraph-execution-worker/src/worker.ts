/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { DBOSExecutionWorker, ExecutionWorker } from '@badaitech/chaingraph-executor/server'
import process from 'node:process'
import { createServices } from '@badaitech/chaingraph-executor/server'
import { config } from './config'
import { createLogger } from './logger'

const logger = createLogger('worker')

let executionWorker: ExecutionWorker | DBOSExecutionWorker | null = null
let isShuttingDown = false
let isDBOSMode = false

export async function startWorker(): Promise<void> {
  const workerId = process.env.WORKER_ID || `worker-${process.pid}`

  try {
    // Set environment variables for the executor package
    process.env.EXECUTION_MODE = config.executionMode
    process.env.DATABASE_URL = config.databaseUrl
    process.env.DATABASE_URL_EXECUTIONS = config.databaseUrlExecutions
    process.env.KAFKA_BROKERS = config.kafka.brokers.join(',')
    process.env.KAFKA_TOPICS_PREFIX = config.kafka.topicsPrefix
    process.env.WORKER_ID = workerId

    // Create services (EventBus, TaskQueue, ExecutionStore, and optionally DBOSWorker)
    const services = await createServices()

    // Check if DBOS mode is enabled
    if (services.dbosWorker) {
      // DBOS mode: Use DBOSExecutionWorker
      logger.info({ workerId }, '🚀 Starting DBOS execution worker')
      isDBOSMode = true
      executionWorker = services.dbosWorker

      await executionWorker.start()

      logger.info({ workerId, pid: process.pid, mode: 'DBOS' }, '✅ DBOS worker started successfully')
    } else {
      // Traditional mode: Use ExecutionWorker with Kafka
      logger.info({ workerId }, '🚀 Starting Kafka execution worker')
      isDBOSMode = false

      // Import ExecutionWorker dynamically to avoid loading it when using DBOS
      const { ExecutionWorker: KafkaExecutionWorker } = await import('@badaitech/chaingraph-executor/server')

      executionWorker = new KafkaExecutionWorker(
        services.executionStore,
        services.eventBus,
        services.taskQueue,
      )

      await executionWorker.start()

      logger.info({ workerId, pid: process.pid, mode: 'Kafka' }, '✅ Kafka worker started successfully')
    }

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
  const mode = isDBOSMode ? 'DBOS' : 'Kafka'
  logger.info({ workerId, mode }, 'Worker shutting down gracefully...')

  try {
    if (executionWorker) {
      await executionWorker.stop()
    }
    logger.info({ workerId, mode }, 'Worker stopped successfully')
    process.exit(0)
  } catch (error) {
    logger.error({ workerId, mode, error }, 'Worker error during shutdown')
    process.exit(1)
  }
}
