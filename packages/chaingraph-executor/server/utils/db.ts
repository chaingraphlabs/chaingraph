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

let pool: pg.Pool | null = null
export type DBType = ReturnType<typeof drizzle>
let db: DBType | null = null

export async function getDatabase(): Promise<DBType> {
  if (!db) {
    pool = new Pool({
      connectionString: config.database.url,
    })

    // Test connection
    try {
      await pool.query('SELECT 1')
    } catch (error) {
      logger.error({ error }, 'Failed to connect to database')
      throw error
    }

    db = drizzle(pool)
  }

  return db
}

export async function closeDatabase() {
  if (pool) {
    await pool.end()
    pool = null
    db = null
    logger.info('Database connection closed')
  }
}
