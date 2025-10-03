/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { cpus } from 'node:os'
import process from 'node:process'
import * as dotenv from 'dotenv'

dotenv.config()

export const config = {
  // Worker process configuration
  workers: {
    count: process.env.WORKER_COUNT === 'auto'
      ? cpus().length
      : Number.parseInt(process.env.WORKER_COUNT || String(cpus().length), 10),
    restartDelay: Number.parseInt(process.env.WORKER_RESTART_DELAY || '1000', 10),
    maxRestarts: Number.parseInt(process.env.MAX_WORKER_RESTARTS || '5', 10), // -1 for infinite restarts
  },

  // Execution mode for the executor package
  executionMode: (process.env.EXECUTION_MODE || 'distributed') as 'local' | 'distributed',

  // Database URL for the executor package
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/chaingraph',
  databaseUrlExecutions: process.env.DATABASE_URL_EXECUTIONS || 'postgres://postgres@localhost:5432/chaingraph',

  // Kafka configuration (needed for distributed mode)
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    topicsPrefix: process.env.KAFKA_TOPICS_PREFIX || '',
  },

  // Health and monitoring
  monitoring: {
    healthPort: Number.parseInt(process.env.HEALTH_PORT || '9090', 10),
    heartbeatInterval: Number.parseInt(process.env.HEARTBEAT_INTERVAL || '5000', 10),
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
