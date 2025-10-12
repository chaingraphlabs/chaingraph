/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import type { IEventBus } from '../../interfaces/IEventBus'
import type { StreamBridge } from './streaming'

import { DBOS } from '@dbos-inc/dbos-sdk'
import { createLogger } from '../../utils/logger'

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
  private static readonly STREAM_KEY = 'events'

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
      await DBOS.writeStream(DBOSEventBus.STREAM_KEY, {
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
   * Delegates to StreamBridge for real-time streaming via MultiChannel
   *
   * @param executionId Execution ID
   * @param fromIndex Starting event index (0-based)
   * @returns Async iterable of event batches
   */
  subscribeToEvents = (
    executionId: string,
    fromIndex: number = 0,
  ): AsyncIterable<ExecutionEventImpl[]> => {
    logger.debug({
      executionId,
      fromIndex,
    }, 'Subscribing to execution events')

    // Return async iterable that awaits channel setup
    return this.createEventIterable(executionId, fromIndex)
  }

  /**
   * Create async iterable wrapper for event streaming
   */
  private async* createEventIterable(
    executionId: string,
    fromIndex: number,
  ): AsyncGenerator<ExecutionEventImpl[]> {
    // Await channel setup
    const channel = await this.streamBridge.subscribeToExecutionEvents(executionId, fromIndex)

    logger.info({ executionId }, 'Starting to iterate MultiChannel')

    // Iterate over MultiChannel (which implements AsyncIterable)
    let batchCount = 0
    for await (const batch of channel) {
      batchCount++
      logger.info({
        executionId,
        batchCount,
        batchSize: batch.length,
      }, 'Yielding batch from MultiChannel')
      yield batch
    }

    logger.info({
      executionId,
      totalBatches: batchCount,
    }, 'MultiChannel iteration completed')
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe = async (executionId: string): Promise<void> => {
    await this.streamBridge.unsubscribe(executionId, DBOSEventBus.STREAM_KEY)
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
