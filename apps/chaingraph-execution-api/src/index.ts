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
import { startServer } from './server'

// Start the server
logger.info('🚀 Starting tRPC Server')
logger.info({
  port: config.port,
  host: config.host,
  instanceId: process.env.NODE_APP_INSTANCE || '0',
}, 'Server configuration')

startServer().catch((error) => {
  logger.error({ error }, 'Failed to start server')
  process.exit(1)
})
