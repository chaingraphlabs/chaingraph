/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { DBOS } from '@dbos-inc/dbos-sdk'
import { config } from '../utils/config'
import { createLogger } from '../utils/logger'

const logger = createLogger('dbos-config')

/**
 * Initialize DBOS with proper configuration
 * This sets up the DBOS runtime, database connections, and system tables
 */
export async function initializeDBOS(): Promise<void> {
  try {
    logger.info('Initializing DBOS...')

    // Configure DBOS with v4 API
    DBOS.setConfig({
      name: 'chaingraph-executor',
      systemDatabaseUrl: config.database.url_executions,
    })

    // Launch DBOS runtime
    await DBOS.launch()

    logger.info('DBOS initialized successfully')
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
  try {
    logger.info('Shutting down DBOS...')
    await DBOS.shutdown()
    logger.info('DBOS shutdown complete')
  } catch (error) {
    logger.error({ error }, 'Error during DBOS shutdown')
    throw error
  }
}
