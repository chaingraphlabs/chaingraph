/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MultiChannel } from '@badaitech/chaingraph-types'

/**
 * Stream identifier for DBOS streams
 */
export interface StreamIdentifier {
  /** DBOS workflow UUID */
  workflowId: string

  /** Stream key within workflow (e.g., 'events', 'results', 'metrics') */
  streamKey: string
}

/**
 * Stream channel state managed by PGListener
 */
export interface StreamChannel<T = any> {
  /** MultiChannel instance for this stream */
  multiChannel: MultiChannel<T[]>

  /** Offset tracking */
  localOffset: number        // What we've READ from database
  remoteOffset: number       // What PostgreSQL says exists (from NOTIFY)
  lastSentOffset: number     // What we've SENT to consumers

  /** Number of active consumers for this stream */
  consumerCount: number

  /** Reader loop control */
  isReading: boolean         // Is DB reader loop active?
  readerPromise?: Promise<void>  // For awaiting reader completion
  isPendingCatchup: boolean  // Initial catch-up in progress?

  /** Cleanup control */
  isCleaningUp: boolean      // Prevent double cleanup
  cleanupPromise?: Promise<void>  // For awaiting cleanup completion

  /** Creation timestamp for metrics */
  createdAt: number
}

/**
 * PostgreSQL notification payload for stream events
 */
export interface StreamNotificationPayload {
  /** Offset of the new stream value */
  offset: number
}

/**
 * PGListener statistics for load balancing
 */
export interface PGListenerStats {
  /** Number of active streams on this listener */
  streamCount: number

  /** Total number of consumers across all streams */
  totalConsumers: number

  /** Listener index in pool */
  listenerIndex: number

  /** Whether listener is at capacity */
  isAtCapacity: boolean
}

/**
 * Pool-wide statistics
 */
export interface PoolStats {
  /** Total number of PGListeners in pool */
  poolSize: number

  /** Total streams across all listeners */
  totalStreams: number

  /** Total consumers across all streams */
  totalConsumers: number

  /** Per-listener statistics */
  listeners: PGListenerStats[]

  /** Load distribution (streams per listener) */
  loadDistribution: number[]
}

/**
 * Batch configuration for consumers
 */
export interface BatchConfig {
  /** Maximum events per batch (default: 100) */
  maxSize?: number

  /** Maximum time to wait before flushing batch in ms (default: 25) */
  timeoutMs?: number
}

/**
 * Subscribe options for stream subscription
 */
export interface SubscribeOptions extends BatchConfig {
  /** DBOS workflow ID */
  workflowId: string

  /** Stream key within workflow */
  streamKey: string

  /** Starting offset (default: 0) */
  fromOffset?: number
}

/**
 * Publish options for bridging MultiChannel → DBOS stream
 */
export interface PublishOptions<T> {
  /** DBOS workflow ID */
  workflowId: string

  /** Stream key within workflow */
  streamKey: string

  /** Source MultiChannel to bridge */
  source: MultiChannel<T>
}

/**
 * Bidirectional pipe options
 */
export interface PipeOptions {
  /** DBOS workflow ID */
  workflowId: string

  /** Input stream key (MultiChannel → DBOS) */
  input: string

  /** Output stream key (DBOS → MultiChannel) */
  output: string
}

/**
 * Bidirectional stream pipe
 */
export interface StreamPipe<TInput = any, TOutput = any> {
  /** MultiChannel for writing to DBOS stream */
  input: MultiChannel<TInput>

  /** MultiChannel for reading from DBOS stream (yields batches) */
  output: MultiChannel<TOutput[]>

  /** Close both channels and cleanup */
  close: () => Promise<void>
}

/**
 * PGListener pool configuration
 */
export const POOL_CONFIG = {
  /** Number of pg-listen subscribers in pool */
  SIZE: 10,

  /** Maximum streams per listener before routing to next */
  MAX_STREAMS_PER_LISTENER: 1000,

  /** Load balancing strategy */
  STRATEGY: 'hash' as const,

  /** Paranoid connection check interval (ms) */
  HEALTH_CHECK_INTERVAL: 30000,

  /** Retry configuration for pg-listen */
  RETRY_TIMEOUT: 5000,
  RETRY_LIMIT: 10,
} as const

/**
 * Batching configuration for stream consumption
 */
export const STREAM_BATCH_CONFIG = {
  /** Maximum items per batch yielded to consumers */
  MAX_BATCH_SIZE: 100,

  /** Maximum time to wait before flushing batch (ms) */
  BATCH_TIMEOUT_MS: 25,

  /** Maximum items to fetch per database query */
  QUERY_BATCH_SIZE: 1000,

  /** Sleep interval for reactive loop (ms) */
  REACTIVE_LOOP_SLEEP_MS: 10,

  /** Polling interval for fallback mode (ms) */
  FALLBACK_POLL_MS: 50,
} as const
