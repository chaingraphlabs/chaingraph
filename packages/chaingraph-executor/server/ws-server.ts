/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import { applyWSSHandler } from '@trpc/server/adapters/ws'
import { WebSocketServer } from 'ws'
import { createContext } from './trpc/context'
import { executionRouter } from './trpc/router'
import { createLogger } from './utils/logger'

const logger = createLogger('ws-server')

export function createWSServer(port: number = 4021, host: string = '0.0.0.0') {
  const wss = new WebSocketServer({
    host,
    port,
  })

  const handler = applyWSSHandler({
    wss,
    router: executionRouter,
    createContext,
    // Enable heartbeat messages to keep the connection open
    keepAlive: {
      enabled: true,
      // server pings message interval in milliseconds
      pingMs: 5000,
      // the connection is terminated if a pong message is not received in this many milliseconds
      pongWaitMs: 10000,
    },
  })

  wss.on('connection', (ws) => {
    logger.info(`➕ Connection (${wss.clients.size})`)
    ws.once('close', () => {
      logger.info(`➖ Connection (${wss.clients.size})`)
    })
  })

  wss.on('error', (err) => {
    logger.error({ error: err }, 'WebSocket Server Error')
  })

  logger.info({ host, port }, `WebSocket Server listening on ws://${host}:${port}`)

  // Handle graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down WebSocket server...')
    handler.broadcastReconnectNotification()
    wss.close(() => {
      logger.info('WebSocket server closed')
    })
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  return {
    wss,
    handler,
    shutdown,
  }
}
