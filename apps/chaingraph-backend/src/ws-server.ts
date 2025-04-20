/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import { applyWSSHandler, appRouter, createContext } from '@badaitech/chaingraph-trpc/server'
import { WebSocketServer } from 'ws'
import { appConfig } from './config'

export function wsServer() {
  const wss = new WebSocketServer({
    host: appConfig.trpcServerHost,
    port: appConfig.trpcServerPort,
  })

  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext,
    // Enable heartbeat messages to keep the connection open (disabled by default)
    keepAlive: {
      enabled: appConfig.trpcServerKeepAlive.enabled || true,
      // server pings message interval in milliseconds
      pingMs: appConfig.trpcServerKeepAlive.pingMs || 5000,
      // the connection is terminated if a pong message is not received in this many milliseconds
      pongWaitMs: appConfig.trpcServerKeepAlive.pongWaitMs || 10000,
    },
  })
  wss.on('connection', (ws) => {
    console.log(`➕➕ Connection (${wss.clients.size})`)
    ws.once('close', () => {
      console.log(`➖➖ Connection (${wss.clients.size})`)
    })
  })
  wss.on('error', (err) => {
    console.error('WebSocket Server Error:', err)
  })
  console.log(`WebSocket Server listening on ws://${appConfig.trpcServerHost}:${appConfig.trpcServerPort}`)
  process.on('SIGTERM', () => {
    console.log('SIGTERM')
    handler.broadcastReconnectNotification()
    wss.close()
  })
}
