/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { config } from './config'
import { createLogger } from './logger'

const logger = createLogger('database')

const { Pool } = pg

export type DBType = ReturnType<typeof drizzle>

let poolMain: pg.Pool | null = null
let dbMain: DBType | null = null

let poolExecutions: pg.Pool | null = null
let dbExecutions: DBType | null = null

export async function getDatabaseMain(): Promise<DBType> {
  if (!dbMain) {
    poolMain = new Pool({
      connectionString: config.database.url_main,
    })

    // Test connection
    try {
      await poolMain.query('SELECT 1')
    } catch (error) {
      logger.error({ error }, 'Failed to connect to database')
      throw error
    }

    dbMain = drizzle(poolMain)
  }

  return dbMain
}

export async function getDatabaseExecutions(): Promise<DBType> {
  if (!dbExecutions) {
    poolExecutions = new Pool({
      connectionString: config.database.url_executions,
    })

    // Test connection
    try {
      await poolExecutions.query('SELECT 1')
    } catch (error) {
      logger.error({ error }, 'Failed to connect to executions database')
      throw error
    }

    dbExecutions = drizzle(poolExecutions)
  }

  return dbExecutions
}

export async function closeDatabaseMain() {
  if (poolMain) {
    await poolMain.end()
    poolMain = null
    dbMain = null
    logger.info('Database connection closed')
  }
}

export async function closeDatabaseExecutions() {
  if (poolExecutions) {
    await poolExecutions.end()
    poolExecutions = null
    dbExecutions = null
    logger.info('Executions database connection closed')
  }
}
