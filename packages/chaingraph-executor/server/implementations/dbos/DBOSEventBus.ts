/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import type { EventBatchConfig, IEventBus } from '../../interfaces/IEventBus'
import type { StreamBridge } from './streaming'

import { DBOS } from '@dbos-inc/dbos-sdk'
import { createLogger } from '../../utils/logger'
import { STREAM_CONSTANTS } from './streaming/types'

const logger = createLogger('dbos-event-bus')

/**
 * DBOS-based implementation of IEventBus
 *
 * Simplified wrapper around StreamBridge for execution event streaming.
 * Uses generic DBOS stream infrastructure with MultiChannel pattern.
 *
 * Features:
 * - Real-time streaming via PostgreSQL LISTEN/NOTIFY
 * - Automatic sharding across PGListener pool
 * - MultiChannel for efficient fan-out
 * - Backward compatible with IEventBus interface
 */
export class DBOSEventBus implements IEventBus {
  /** Generic stream bridge (handles all complexity) */
  private readonly streamBridge: StreamBridge

  constructor(streamBridge: StreamBridge) {
    this.streamBridge = streamBridge
    logger.info('DBOSEventBus initialized')
  }

  /**
   * Publish an execution event to DBOS stream
   *
   * Note: This continues to use DBOS.writeStream() directly
   * to maintain existing execution flow (no changes to ExecutionWorkflow)
   *
   * @param executionId Execution ID (also workflow ID)
   * @param event Event to publish
   */
  publishEvent = async (executionId: string, event: ExecutionEventImpl): Promise<void> => {
    try {
      const serializedEvent = event.serialize()

      // Write to DBOS stream (existing flow, no changes)
      await DBOS.writeStream(STREAM_CONSTANTS.EVENTS_STREAM_KEY, {
        executionId,
        event: serializedEvent,
        timestamp: Date.now(),
      })
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        executionId,
        eventType: event.type,
        eventIndex: event.index,
      }, 'Failed to write event to DBOS stream')
      throw error
    }
  }

  /**
   * Subscribe to execution events
   *
   * @param executionId Execution ID
   * @param fromIndex Starting event index (0-based)
   * @param batchConfig Optional batching configuration
   * @returns Async iterable of event batches
   */
  subscribeToEvents = (
    executionId: string,
    fromIndex: number = 0,
    batchConfig?: EventBatchConfig,
  ): AsyncIterable<ExecutionEventImpl[]> => {
    return this.createEventIterable(executionId, fromIndex, batchConfig)
  }

  /**
   * Create async iterable wrapper for event streaming
   */
  private async* createEventIterable(
    executionId: string,
    fromIndex: number,
    batchConfig?: EventBatchConfig,
  ): AsyncGenerator<ExecutionEventImpl[]> {
    // Subscribe with batching config
    const channel = await this.streamBridge.subscribe<ExecutionEventImpl>({
      workflowId: executionId,
      streamKey: STREAM_CONSTANTS.EVENTS_STREAM_KEY,
      fromOffset: fromIndex,
      maxSize: batchConfig?.maxSize,
      timeoutMs: batchConfig?.timeoutMs,
    })

    // Iterate over MultiChannel
    for await (const batch of channel) {
      yield batch
    }
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe = async (executionId: string): Promise<void> => {
    await this.streamBridge.unsubscribe(executionId, STREAM_CONSTANTS.EVENTS_STREAM_KEY)
    logger.debug({ executionId }, 'Unsubscribed from execution events')
  }

  /**
   * Close the event bus
   */
  close = async (): Promise<void> => {
    await this.streamBridge.close()
    logger.info('Event bus closed')
  }

  /**
   * Close stream for specific execution (no-op)
   *
   * DBOS automatically closes streams when workflow terminates
   */
  async closeStream(executionId: string): Promise<void> {
    logger.debug({ executionId }, 'Stream close requested (auto-handled by DBOS)')
  }
}
