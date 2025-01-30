import process from 'node:process'
import { createContext } from '@chaingraph/backend/context'
import { appRouter } from '@chaingraph/backend/router'
import { applyWSSHandler } from '@trpc/server/adapters/ws'
import ws from 'ws'

export function wsServer() {
  const wss = new ws.Server({
    port: 3001,
  })

  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext,
    // Enable heartbeat messages to keep connection open (disabled by default)
    keepAlive: {
      enabled: true,
      // server ping message interval in milliseconds
      pingMs: 30000,
      // connection is terminated if pong message is not received in this many milliseconds
      pongWaitMs: 5000,
    },
  })
  wss.on('connection', (ws) => {
    console.log(`➕➕ Connection (${wss.clients.size})`)
    ws.once('close', () => {
      console.log(`➖➖ Connection (${wss.clients.size})`)
    })
  })
  console.log('WebSocket Server listening on ws://localhost:3001')
  process.on('SIGTERM', () => {
    console.log('SIGTERM')
    handler.broadcastReconnectNotification()
    wss.close()
  })
}
