/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import { applyWSSHandler, appRouter, createContext } from '@badaitech/trpc/server'
import { WebSocketServer } from 'ws'

export function wsServer() {
  const wss = new WebSocketServer({
    port: 3001,
  })

  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext,
    // Enable heartbeat messages to keep connection open (disabled by default)
    keepAlive: {
      enabled: false,
      // server ping message interval in milliseconds
      pingMs: 3000,
      // connection is terminated if pong message is not received in this many milliseconds
      pongWaitMs: 10000,
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
  console.log('WebSocket Server listening on ws://localhost:3001')
  process.on('SIGTERM', () => {
    console.log('SIGTERM')
    handler.broadcastReconnectNotification()
    wss.close()
  })
}
