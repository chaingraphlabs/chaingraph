/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import * as dotenv from 'dotenv'

dotenv.config()

// Calculate port based on base port and PM2 instance ID
const basePort = Number.parseInt(process.env.PORT || '4021', 10)
const instanceId = Number.parseInt(process.env.NODE_APP_INSTANCE || '0', 10)

export const config = {
  // Server configuration
  port: basePort + instanceId, // PM2 will set NODE_APP_INSTANCE for each instance
  host: process.env.HOST || 'localhost',

  // Database URL for the executor package
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/chaingraph',
  databaseUrlExecutions: process.env.DATABASE_URL_EXECUTIONS || 'postgres://postgres@localhost:5432/chaingraph',

  // Kafka configuration (needed for distributed mode)
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.NODE_ENV !== 'production',
  },

  // Environment
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
}
