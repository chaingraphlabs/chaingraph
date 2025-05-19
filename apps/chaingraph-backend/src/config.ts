/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

// config for backend node app
export const appConfig = {
  trpcServerHost: process.env.TRPC_SERVER_HOST || 'localhost',
  trpcServerPort: Number.parseInt(process.env.TRPC_SERVER_PORT || '3001', 10),
  trpcServerKeepAlive: {
    enabled: (process.env.TRPC_SERVER_KEEP_ALIVE_ENABLED || 'true') === 'true',
    pingMs: Number.parseInt(process.env.TRPC_SERVER_KEEP_ALIVE_PING_MS || '5000', 10),
    pongWaitMs: Number.parseInt(process.env.TRPC_SERVER_KEEP_ALIVE_PONG_WAIT_MS || '10000', 10),
  },

  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres@localhost:5431/postgres?sslmode=disable',
  authEnabled: process.env.AUTH_ENABLED === 'true',
  authDevMode: process.env.AUTH_DEV_MODE === 'true',
  badAIAuthEnabled: process.env.BADAI_AUTH_ENABLED === 'true',
  badAIAPIUrl: process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
}

/**
 * Pretty print the config object and hide with *** sensitive information
 */
export function prettyPrintConfig() {
  // Create a copy of the config to avoid modifying the original
  const configCopy = { ...appConfig }

  // Mask sensitive information
  if (configCopy.databaseUrl) {
    configCopy.databaseUrl = configCopy.databaseUrl.replace(/postgres:\/\/([^:]+)(:[^@]+)?@/, 'postgres://***:***@')
  }

  console.log('\n=== ChainGraph Backend Configuration ===')
  console.log('Server:')
  console.log(`  Host: ${configCopy.trpcServerHost}`)
  console.log(`  Port: ${configCopy.trpcServerPort}`)
  console.log('Keep-Alive:')
  console.log(`  Enabled: ${configCopy.trpcServerKeepAlive.enabled}`)
  console.log(`  Ping Interval: ${configCopy.trpcServerKeepAlive.pingMs}ms`)
  console.log(`  Pong Timeout: ${configCopy.trpcServerKeepAlive.pongWaitMs}ms`)
  console.log('Authentication:')
  console.log(`  Enabled: ${configCopy.authEnabled}`)
  console.log(`  Dev Mode: ${configCopy.authDevMode}`)
  console.log(`  BadAI Auth: ${configCopy.badAIAuthEnabled}`)
  if (configCopy.badAIAuthEnabled) {
    console.log(`  BadAI API URL: ${configCopy.badAIAPIUrl}`)
  }
  console.log('=======================================\n')
}
