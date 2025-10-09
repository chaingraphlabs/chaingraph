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
    logger.info('Initializing DBOS...')

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

    // log if conductor is configured
    if (config.dbos.conductorKey) {
      logger.info(`DBOS Conductor configured, connecting to conductor at ${config.dbos.conductorKey}`)
    }

    // Launch DBOS runtime
    await DBOS.launch({
      conductorURL: config.dbos.conductorURL,
      conductorKey: config.dbos.conductorKey,
    })

    isDBOSInitialized = true

    logger.info({
      systemDatabaseUrl: config.dbos.systemDatabaseUrl,
      adminServerEnabled: config.dbos.adminServer.enabled,
      adminServerPort: config.dbos.adminServer.enabled ? config.dbos.adminServer.port : 'disabled',
      queueConcurrency: config.dbos.queueConcurrency,
      workerConcurrency: config.dbos.workerConcurrency,
    }, 'DBOS initialized successfully')
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
