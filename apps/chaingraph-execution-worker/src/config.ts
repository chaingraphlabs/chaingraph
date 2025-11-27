/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import * as dotenv from 'dotenv'

dotenv.config({ path: ['.env', '../../.env'] })

/**
 * Execution Worker Configuration
 *
 * DBOS handles concurrency internally via its WorkflowQueue settings:
 * - workerConcurrency: Max concurrent executions per worker process
 * - concurrency: Global max concurrent executions across all workers
 *
 * These are configured in the chaingraph-executor package's queue.ts
 * via DBOS_WORKER_CONCURRENCY and DBOS_QUEUE_CONCURRENCY env vars.
 */
export const config = {
  // Execution mode (always 'dbos' for this worker)
  executionMode: 'dbos' as const,

  // Database URLs
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/chaingraph',
  databaseUrlExecutions: process.env.DATABASE_URL_EXECUTIONS || process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/chaingraph',

  // Health server for Kubernetes liveness/readiness probes
  health: {
    port: Number.parseInt(process.env.HEALTH_PORT || '9090', 10),
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
