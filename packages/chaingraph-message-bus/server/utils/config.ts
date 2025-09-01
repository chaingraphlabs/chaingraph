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

export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/chaingraph',
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092,localhost:9093,localhost:9094').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'chaingraph-message-bus',
    groupId: {
      worker: process.env.KAFKA_GROUP_ID_WORKER || 'chaingraph-execution-workers',
      stream: process.env.KAFKA_GROUP_ID_STREAM || 'chaingraph-event-stream',
    },
  },

  // Worker Configuration
  worker: {
    id: process.env.WORKER_ID || `worker-${Math.random().toString(36).substring(7)}`,
    concurrency: Number.parseInt(process.env.WORKER_CONCURRENCY || '10', 10),
    memoryLimitMB: Number.parseInt(process.env.WORKER_MEMORY_LIMIT_MB || '512', 10),
    timeoutMs: Number.parseInt(process.env.WORKER_TIMEOUT_MS || '300000', 10),
  },

  // Event Stream Configuration
  eventStream: {
    port: Number.parseInt(process.env.EVENT_STREAM_PORT || '4001', 10),
    wsPath: process.env.EVENT_STREAM_WS_PATH || '/ws',
    bufferSize: Number.parseInt(process.env.EVENT_STREAM_BUFFER_SIZE || '1000', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.NODE_ENV !== 'production',
  },
}
