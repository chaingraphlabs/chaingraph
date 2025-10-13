/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'

/**
 * Batching configuration for event streaming
 */
export interface EventBatchConfig {
  /** Maximum events per batch */
  maxSize?: number

  /** Maximum time to wait before flushing batch (ms) */
  timeoutMs?: number
}

/**
 * Interface for event bus implementations
 * Handles publishing and subscribing to execution events
 */
export interface IEventBus {
  /**
   * Publish an execution event
   */
  publishEvent: (executionId: string, event: ExecutionEventImpl) => Promise<void>

  /**
   * Subscribe to execution events
   * Returns an async iterator for streaming events
   *
   * @param executionId Execution ID to subscribe to
   * @param fromIndex Starting event index (0-based)
   * @param batchConfig Optional batching configuration for consumers
   */
  subscribeToEvents: (
    executionId: string,
    fromIndex?: number,
    batchConfig?: EventBatchConfig,
  ) => AsyncIterable<ExecutionEventImpl[]>

  /**
   * Unsubscribe from events for a specific execution
   */
  unsubscribe: (executionId: string) => Promise<void>

  /**
   * Close all subscriptions and cleanup resources
   */
  close: () => Promise<void>
}
