/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import { createTopicsIfNotExist } from '../kafka/topics'
import { createLogger } from '../utils/logger'
import { EventStreamService } from './event-stream-service'
import '../utils/shared-init' // Import shared initialization

const logger = createLogger('event-stream-main')

async function main() {
  logger.info('Starting Chaingraph Event Stream Service')

  // Create Kafka topics if they don't exist
  try {
    await createTopicsIfNotExist()
  } catch (error) {
    logger.error({ error }, 'Failed to create Kafka topics')
    process.exit(1)
  }

  // Create and start service
  const service = new EventStreamService()

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down event stream service')

    try {
      await service.stop()
      logger.info('Event stream service shutdown complete')
      process.exit(0)
    } catch (error) {
      logger.error({ error }, 'Error during shutdown')
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  // Start the service
  try {
    await service.start()
  } catch (error) {
    logger.error({ error }, 'Failed to start event stream service')
    process.exit(1)
  }
}

// Run the service
main().catch((error) => {
  logger.error({ error }, 'Unhandled error in event stream service')
  process.exit(1)
})
