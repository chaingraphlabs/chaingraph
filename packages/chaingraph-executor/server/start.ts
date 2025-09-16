/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { config, createLogger, createServices, createTopicsIfNotExist, ExecutionWorker } from './index'
import { createWSServer } from './ws-server'

const logger = createLogger('startup')

async function main() {
  logger.info({
    mode: config.mode,
    workerId: config.worker.id,
  }, `Starting Chaingraph Execution System in ${config.mode} mode`)

  try {
    // Initialize node registry
    const nodeRegistry = NodeRegistry.getInstance()

    // Create Kafka topics if in distributed mode
    if (config.mode === 'distributed') {
      logger.info('Creating Kafka topics if they don\'t exist')
      await createTopicsIfNotExist()
    }

    // Create services based on execution mode
    const services = await createServices(nodeRegistry)
    logger.info('Services initialized successfully')

    // Create and start worker pool
    const worker = new ExecutionWorker(
      services.executionStore,
      services.eventBus,
      services.taskQueue,
      nodeRegistry,
    )
    await worker.start()

    // Start WebSocket server for tRPC API
    const PORT = Number(process.env.TRPC_PORT) || 4021
    const HOST = process.env.TRPC_HOST || '0.0.0.0'

    const wsServer = createWSServer(PORT, HOST)

    logger.info({
      mode: config.mode,
      features: {
        kafka: config.mode === 'distributed',
        inMemory: config.mode === 'local',
        postgres: true,
        trpc: true,
        websocket: true,
        claims: true,
      },
      endpoints: {
        trpc: `ws://${HOST}:${PORT}`,
      },
    }, 'Execution system is running')

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down...')

      try {
        // Stop worker
        await worker.stop()

        // Close services
        await services.eventBus.close()
        await services.taskQueue.close()

        // Close WebSocket server
        wsServer.shutdown()

        logger.info('Shutdown complete')
        process.exit(0)
      } catch (error) {
        logger.error({ error }, 'Error during shutdown')
        process.exit(1)
      }
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)

    // Keep the process running
    await new Promise(() => {})
  } catch (error) {
    logger.error({ error }, 'Failed to start execution system')
    process.exit(1)
  }
}

// Run if this is the main module
if (require.main === module) {
  main().then((r) => {
    logger.info('Startup script has finished execution')
    return r
  }).catch((error) => {
    logger.error({ error }, 'Unhandled error in startup script')
    process.exit(1)
  })
}
