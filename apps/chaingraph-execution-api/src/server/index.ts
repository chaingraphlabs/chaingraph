/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { setMaxListeners } from 'node:events'
import process from 'node:process'
import { createServices, createWSServer } from '@badaitech/chaingraph-executor/server'
import { init } from '@badaitech/chaingraph-trpc/server/init'
import { config } from '../config'
import { createLogger } from '../logger'

const logger = createLogger('trpc-server')

export async function startServer(): Promise<void> {
  setMaxListeners(100000)
  process.setMaxListeners(0)

  await init()

  try {
    // Initialize services first (required by the executor)
    await createServices()
    logger.info('Services initialized')

    // Use the executor's WebSocket server
    const { wss } = createWSServer(config.port, config.host)

    logger.info({ port: config.port, host: config.host }, '✅ Server started')
  } catch (error) {
    logger.error({ error }, 'Failed to start server')
    process.exit(1)
  }
}
