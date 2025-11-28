/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import { authConfig } from '@badaitech/chaingraph-trpc/server'
import * as dotenv from 'dotenv'
import { DBOS_APPLICATION_VERSION } from '../dbos/version'

dotenv.config()

export type ExecutionMode = 'local' | 'dbos'

export const config = {
  // Execution Mode
  mode: (process.env.EXECUTION_MODE || 'local') as ExecutionMode,

  // Database
  database: {
    url_main: process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/chaingraph',
    url_executions: process.env.DATABASE_URL_EXECUTIONS || process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/chaingraph',
  },

  // Worker Configuration
  worker: {
    // Priority: WORKER_ID (explicit) > HOSTNAME (K8s pod name) > random (dev)
    id: process.env.WORKER_ID || process.env.HOSTNAME || `worker-${Math.random().toString(36).substring(7)}`,
    concurrency: Number.parseInt(process.env.WORKER_CONCURRENCY || '10', 10),
    // memoryLimitMB: Number.parseInt(process.env.WORKER_MEMORY_LIMIT_MB || '512', 10),
    // timeoutMs: Number.parseInt(process.env.WORKER_TIMEOUT_MS || '300000', 10),
    claimTimeoutMs: Number.parseInt(process.env.WORKER_CLAIM_TIMEOUT_MS || '30000', 10),
    heartbeatIntervalMs: Number.parseInt(process.env.WORKER_HEARTBEAT_INTERVAL_MS || '5000', 10),
    claimExpirationCheckIntervalMs: Number.parseInt(process.env.WORKER_CLAIM_EXPIRATION_CHECK_MS || '10000', 10),
  },

  authConfig,

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.NODE_ENV !== 'production',
  },

  // Metrics Configuration
  metrics: {
    enabled: process.env.ENABLE_METRICS === 'true',
    logLevel: (process.env.METRICS_LOG_LEVEL || 'debug') as 'debug' | 'info' | 'warn',
    sampling: process.env.METRICS_SAMPLING_ENABLED === 'true'
      ? {
          enabled: true,
          rate: Number.parseFloat(process.env.METRICS_SAMPLING_RATE || '1.0'),
        }
      : undefined,
    batchSize: Number.parseInt(process.env.METRICS_BATCH_SIZE || '1', 10),
    flushInterval: Number.parseInt(process.env.METRICS_FLUSH_INTERVAL || '1000', 10),
    includeMemoryMetrics: process.env.METRICS_INCLUDE_MEMORY === 'true',
  },

  // Recovery Configuration
  recovery: {
    enabled: process.env.ENABLE_RECOVERY !== 'false', // Enabled by default
    scanIntervalMs: Number.parseInt(process.env.RECOVERY_SCAN_INTERVAL_MS || '30000', 10), // 30 seconds
    maxFailureCount: Number.parseInt(process.env.RECOVERY_MAX_FAILURE_COUNT || '5', 10), // Max 5 failures before permanent failure
  },

  // DBOS Configuration (Production execution engine)
  dbos: {
    /**
     * Enable DBOS-based execution (recommended for production)
     * When enabled, uses DBOS Durable Queues and workflows for execution
     * When disabled, falls back to local in-memory mode (development only)
     */
    enabled: process.env.ENABLE_DBOS_EXECUTION === 'true',

    /**
     * DBOS Conductor URL for connecting to a remote DBOS server
     * If not set, assumes DBOS is running in "embedded" mode within this process
     * In production, it's recommended to run a separate DBOS server and set this URL
     */
    conductorURL: process.env.DBOS_CONDUCTOR_URL || undefined,

    /**
     * Application Name for DBOS client identification
     * Used in logging and monitoring on the DBOS server side
     */
    applicationName: process.env.DBOS_APPLICATION_NAME || 'chaingraph-executor',

    /**
     * DBOS Conductor Key for authenticating with DBOS server
     * If not set, assumes DBOS is running in "embedded" mode within this process
     * In production, it's recommended to run a separate DBOS server and set this key
     */
    conductorKey: process.env.DBOS_CONDUCTOR_KEY || undefined,

    /**
     * Database URL for DBOS system tables
     * Defaults to the main executions database
     */
    systemDatabaseUrl: process.env.DATABASE_URL_EXECUTIONS || process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/chaingraph',

    /**
     * Connection pool size for the DBOS system database
     */
    systemDatabasePoolSize: Number.parseInt(process.env.DBOS_SYSTEM_DATABASE_POOL_SIZE || '10', 10),

    /**
     * Application version for DBOS workflows
     * HARDCODED to ensure API and Worker use the same version.
     * DO NOT use env vars - they can drift between deployments.
     */
    applicationVersion: DBOS_APPLICATION_VERSION,

    /**
     * DBOS Admin Server Configuration
     * The admin server provides a management interface for DBOS workflows
     * Set port to null/undefined to disable the admin server
     */
    adminServer: {
      enabled: process.env.DBOS_ADMIN_ENABLED !== 'false', // Enabled by default
      port: process.env.DBOS_ADMIN_PORT ? Number.parseInt(process.env.DBOS_ADMIN_PORT, 10) : 3022,
    },

    /**
     * Global concurrency limit across all workers
     * Maximum number of executions running simultaneously across the entire cluster
     */
    queueConcurrency: Number.parseInt(process.env.DBOS_QUEUE_CONCURRENCY || '100', 10),

    /**
     * Per-worker concurrency limit
     * Maximum number of executions running simultaneously on a single worker process
     * Should be lower than global concurrency to allow load distribution
     */
    workerConcurrency: Number.parseInt(process.env.DBOS_WORKER_CONCURRENCY || '5', 10),
  },
}
