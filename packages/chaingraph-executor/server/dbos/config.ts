/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { DBOSConfig } from '@dbos-inc/dbos-sdk'
import { DBOS } from '@dbos-inc/dbos-sdk'
import { config } from '../utils/config'
import { createLogger } from '../utils/logger'

const logger = createLogger('dbos-config')

// Track if DBOS has been initialized to prevent double initialization
let isDBOSInitialized = false

/**
 * Mask sensitive information in database URLs
 * Hides password and shows only essential connection info
 */
function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Keep only the protocol, host, port, and database name
    // Hide username and password
    const host = parsed.host
    const database = parsed.pathname
    return `postgres://*****@${host}${database}`
  } catch {
    return 'postgres://*****@hidden'
  }
}

/**
 * Suppress DBOS SDK's verbose console output during initialization
 * DBOS logs sensitive information (DB URLs, executor IDs) to console
 * This captures and filters those logs
 */
function suppressDBOSLogs(fn: () => Promise<void>): Promise<void> {
  // Store original console methods
  const originalLog = console.log
  const originalInfo = console.info
  const originalWarn = console.warn

  // Suppress DBOS initialization logs (they contain sensitive data)
  // DBOS logs directly to console, bypassing our logger
  console.log = () => {}
  console.info = () => {}
  console.warn = (message: any) => {
    // Only show critical warnings from DBOS
    if (typeof message === 'string' && (
      message.includes('Unable to start DBOS admin server')
      || message.includes('error')
      || message.includes('Error')
    )) {
      originalWarn(message)
    }
  }

  return fn().finally(() => {
    // Restore original console methods
    console.log = originalLog
    console.info = originalInfo
    console.warn = originalWarn
  })
}

/**
 * Check if DBOS has been initialized
 */
export function isDBOSLaunched(): boolean {
  return isDBOSInitialized
}

/**
 * Initialize DBOS with proper configuration
 * This sets up the DBOS runtime, database connections, and system tables
 * Safe to call multiple times - will skip if already initialized
 */
export async function initializeDBOS(): Promise<void> {
  if (isDBOSInitialized) {
    logger.debug('DBOS already initialized, skipping')
    return
  }

  try {
    // Configure DBOS with v4 API
    const dbosConfig: DBOSConfig = {
      name: config.dbos.applicationName,
      systemDatabaseUrl: config.dbos.systemDatabaseUrl,
    }

    // Configure admin server (management UI)
    if (config.dbos.adminServer.enabled) {
      dbosConfig.runAdminServer = true
      dbosConfig.adminPort = config.dbos.adminServer.port || 3120
    } else {
      // Disable admin server by setting port to null
      dbosConfig.runAdminServer = false
    }

    DBOS.setConfig(dbosConfig)

    // Log masked connection info (safe for production logs)
    logger.info({
      database: maskDatabaseUrl(config.dbos.systemDatabaseUrl),
      adminServer: config.dbos.adminServer.enabled ? `port ${config.dbos.adminServer.port}` : 'disabled',
    }, 'Initializing DBOS runtime')

    // Launch DBOS runtime with suppressed verbose output
    // DBOS SDK logs sensitive information (DB URLs, executor IDs) to console
    // We suppress these logs and only show our own safe logs
    await suppressDBOSLogs(async () => {
      await DBOS.launch({
        conductorURL: config.dbos.conductorURL,
        conductorKey: config.dbos.conductorKey,
      })
    })

    isDBOSInitialized = true

    logger.info({
      queueConcurrency: config.dbos.queueConcurrency,
      workerConcurrency: config.dbos.workerConcurrency,
    }, 'DBOS runtime ready')
  } catch (error) {
    logger.error({ error }, 'Failed to initialize DBOS')
    throw error
  }
}

/**
 * Shutdown DBOS gracefully
 * This closes database connections and cleans up resources
 */
export async function shutdownDBOS(): Promise<void> {
  if (!isDBOSInitialized) {
    logger.debug('DBOS not initialized, skipping shutdown')
    return
  }

  try {
    logger.info('Shutting down DBOS...')
    await DBOS.shutdown()
    isDBOSInitialized = false
    logger.info('DBOS shutdown complete')
  } catch (error) {
    logger.error({ error }, 'Error during DBOS shutdown')
    throw error
  }
}
