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
  if (cluster.isPrimary) {
    logger.info('🚀 Starting Chaingraph Execution Worker Service')
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
    // This is a worker process
    await startWorker()
  }
}

main().catch((error) => {
  logger.error({ error }, 'Failed to start service')
  process.exit(1)
})
