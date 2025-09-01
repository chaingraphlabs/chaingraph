/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import { disconnectEventProducer } from '../kafka/producers/event-producer'
import { disconnectTaskProducer } from '../kafka/producers/task-producer'
import { createTopicsIfNotExist } from '../kafka/topics'
import { closeDatabase } from '../utils/db'
import { createLogger } from '../utils/logger'
import { ExecutionWorker } from './execution-worker'
import '../utils/shared-init' // Import shared initialization

const logger = createLogger('worker-main')

async function main() {
  logger.info('Starting Chaingraph Execution Worker')

  // Create Kafka topics if they don't exist
  try {
    await createTopicsIfNotExist()
  } catch (error) {
    logger.error({ error }, 'Failed to create Kafka topics')
    process.exit(1)
  }

  // Create and start worker
  const worker = new ExecutionWorker()

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down worker')

    try {
      await worker.stop()
      await disconnectEventProducer()
      await disconnectTaskProducer()
      await closeDatabase()

      logger.info('Worker shutdown complete')
      process.exit(0)
    } catch (error) {
      logger.error({ error }, 'Error during shutdown')
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  // Start the worker
  try {
    await worker.start()
  } catch (error) {
    logger.error({ error }, 'Failed to start worker')
    process.exit(1)
  }
}

// Run the worker
main().catch((error) => {
  logger.error({ error }, 'Unhandled error in worker')
  process.exit(1)
})
