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

dotenv.config()

export type ExecutionMode = 'local' | 'distributed'

export const config = {
  // Execution Mode
  mode: (process.env.EXECUTION_MODE || 'local') as ExecutionMode,

  // Database
  database: {
    url_main: process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/chaingraph',
    url_executions: process.env.DATABASE_URL_EXECUTIONS || process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/chaingraph',
  },

  // Kafka (only used in distributed mode)
  kafka: {
    /**
     * KAFKA_BROKERS: Comma-separated list of Kafka broker addresses
     *
     * Multi-environment considerations:
     * - Can be SHARED across all environments (prod, staging, dev)
     * - The same Kafka cluster handles all environments
     * - Environment separation is achieved through topic prefixes, NOT separate brokers
     *
     * Example configurations:
     * - Production cluster: "kafka-1.prod:9092,kafka-2.prod:9092,kafka-3.prod:9092"
     * - Development: "localhost:9092" or shared cluster
     *
     * High availability: Always specify multiple brokers for redundancy
     */
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092,localhost:9093,localhost:9094').split(','),

    /**
     * KAFKA_CLIENT_ID: Unique identifier for this Kafka client connection
     *
     * Multi-environment considerations:
     * - Should be UNIQUE per environment AND service type
     * - Format: "{environment}-{service}-{instance}"
     * - Helps with debugging and monitoring Kafka connections
     *
     * Example configurations:
     * - Production API: "prod-chaingraph-api"
     * - Production Worker: "prod-chaingraph-worker"
     * - Staging API: "staging-chaingraph-api"
     * - Dev Worker: "dev-chaingraph-worker"
     *
     * Note: Multiple replicas of the same service can share the same clientId
     * as it's just for connection identification, not for consumer group management
     */
    clientId: process.env.KAFKA_CLIENT_ID || 'chaingraph-executor',

    /**
     * KAFKA_TOPICS_PREFIX: Critical for environment separation on shared Kafka cluster
     *
     * Multi-environment considerations:
     * - MUST be UNIQUE per environment to prevent cross-environment data pollution
     * - All topics will be prefixed with this value
     * - Format: "{environment}." (note the trailing dot)
     *
     * Example configurations:
     * - Production: "prod." → topics: "prod.chaingraph.execution.tasks"
     * - Staging: "staging." → topics: "staging.chaingraph.execution.tasks"
     * - Development: "dev." → topics: "dev.chaingraph.execution.tasks"
     * - Local development: "" (empty, no prefix)
     *
     * CRITICAL: Without unique prefixes, different environments will read/write
     * to the same topics, causing data corruption and processing errors!
     */
    topicsPrefix: process.env.KAFKA_TOPICS_PREFIX || '',

    groupId: {
      /**
       * KAFKA_GROUP_ID_WORKER: Consumer group for task processing workers
       *
       * Multi-environment considerations:
       * - Should be UNIQUE per environment but SHARED across worker replicas
       * - All worker replicas in the same environment join the same group
       * - Kafka automatically load-balances partitions across group members
       *
       * Example configurations:
       * - Production: "prod-chaingraph-execution-workers"
       * - Staging: "staging-chaingraph-execution-workers"
       * - Development: "dev-chaingraph-execution-workers"
       *
       * Scaling behavior:
       * - Multiple worker instances with the SAME group ID = load balancing
       * - Each message is processed by only ONE worker in the group
       * - Kafka rebalances partitions when workers join/leave
       *
       * IMPORTANT: All worker replicas in an environment MUST use the same group ID
       * to ensure proper load distribution and prevent duplicate processing
       */
      worker: process.env.KAFKA_GROUP_ID_WORKER || 'chaingraph-execution-workers',

      /**
       * KAFKA_GROUP_ID_STREAM: Consumer group for event streaming
       *
       * Multi-environment considerations:
       * - Should be UNIQUE per environment
       * - Used for consuming execution events from the events topic
       * - Different from worker group to allow independent scaling
       *
       * Example configurations:
       * - Production: "prod-chaingraph-event-stream"
       * - Staging: "staging-chaingraph-event-stream"
       * - Development: "dev-chaingraph-event-stream"
       *
       * Use cases:
       * - Event monitoring and logging
       * - Real-time event streaming to clients
       * - Analytics and metrics collection
       *
       * Note: Unlike workers, event stream consumers might want to see ALL events,
       * so consider if you need unique group IDs per consumer instance
       */
      stream: process.env.KAFKA_GROUP_ID_STREAM || 'chaingraph-event-stream',
    },
  },

  // Worker Configuration
  worker: {
    id: process.env.WORKER_ID || `worker-${Math.random().toString(36).substring(7)}`,
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
}
