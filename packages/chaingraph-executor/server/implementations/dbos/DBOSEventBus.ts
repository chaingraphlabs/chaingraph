/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import type { IEventBus } from '../../interfaces/IEventBus'
import { ExecutionEventImpl as EventImpl } from '@badaitech/chaingraph-types'
import { DBOS } from '@dbos-inc/dbos-sdk'
import { createLogger } from '../../utils/logger'

const logger = createLogger('dbos-event-bus')

/**
 * DBOS-based implementation of IEventBus using workflow streaming
 *
 * This implementation uses DBOS.writeStream() and DBOS.readStream() to provide
 * real-time event streaming with durable storage in PostgreSQL.
 *
 * Key Features:
 * - Real-time streaming: Events are written as they're generated (from steps)
 * - Durable: Events are stored in DBOS system tables
 * - Exactly-once reads: Each subscriber sees each event exactly once
 * - At-least-once writes: If a step retries, events may be written multiple times
 * - No Kafka dependency: Uses PostgreSQL for event streaming
 *
 * Stream Key Format:
 * - Single stream per execution: 'events'
 * - WorkflowID = ExecutionID for easy correlation
 *
 * Usage:
 * ```typescript
 * // Publishing (from step or workflow)
 * await eventBus.publishEvent(executionId, event)
 *
 * // Subscribing (from anywhere)
 * for await (const events of eventBus.subscribeToEvents(executionId)) {
 *   for (const event of events) {
 *     console.log(event)
 *   }
 * }
 * ```
 */
export class DBOSEventBus implements IEventBus {
  private static readonly STREAM_KEY = 'events'

  /**
   * Publish an execution event to DBOS stream
   *
   * This writes the event to DBOS workflow stream in real-time.
   * The event is durably stored in PostgreSQL and can be read by subscribers.
   *
   * Note: When called from a step, this has at-least-once semantics.
   * If the step fails and retries, the same event may be written multiple times.
   * Subscribers will see all writes in order.
   *
   * @param executionId The execution ID (also the workflow ID)
   * @param event The event to publish
   */
  publishEvent = async (executionId: string, event: ExecutionEventImpl): Promise<void> => {
    try {
      // Serialize event for storage
      const serializedEvent = event.serialize()

      // Write to DBOS stream
      // Note: This can be called from both workflows and steps
      // From steps: at-least-once semantics (may write multiple times on retry)
      // From workflows: exactly-once semantics
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
   * Subscribe to execution events from DBOS stream
   *
   * This returns an async iterable that yields batches of events as they're written.
   * The subscription reads from DBOS workflow stream and filters by executionId.
   *
   * @param executionId The execution ID to subscribe to
   * @param fromIndex Optional starting index (0-based)
   * @returns Async iterable of event batches
   */
  subscribeToEvents = (
    executionId: string,
    fromIndex: number = 0,
  ): AsyncIterable<ExecutionEventImpl[]> => {
    logger.debug({
      executionId,
      fromIndex,
    }, 'Creating DBOS stream subscription')

    return this.createEventGenerator(executionId, fromIndex)
  }

  /**
   * Unsubscribe from events for a specific execution
   *
   * Note: In DBOS, streams are automatically cleaned up when workflows complete.
   * This is a no-op for compatibility with IEventBus interface.
   *
   * @param executionId The execution ID to unsubscribe from
   */
  unsubscribe = async (executionId: string): Promise<void> => {
    logger.debug({ executionId }, 'Unsubscribed from DBOS stream (no-op)')
    // DBOS handles stream cleanup automatically
  }

  /**
   * Close the event bus and cleanup resources
   *
   * Note: In DBOS, streams are managed by the DBOS runtime.
   * This is a no-op for compatibility with IEventBus interface.
   */
  close = async (): Promise<void> => {
    logger.info('DBOS event bus closed')
  }

  /**
   * Close the stream for a specific execution
   *
   * NOTE: This method is a no-op. DBOS automatically closes streams when the workflow
   * terminates, so manual closing is not necessary. This method is kept for API
   * compatibility but does nothing.
   *
   * From DBOS documentation:
   * "Streams are automatically closed when the workflow terminates."
   *
   * @param executionId The execution ID whose stream to close
   */
  async closeStream(executionId: string): Promise<void> {
    // No-op: DBOS automatically closes streams when workflow terminates
    // Manual closeStream() can only be called from within workflow/step context,
    // which causes context loss issues when called through object methods
    logger.debug({ executionId }, 'Stream close requested (auto-close by DBOS on workflow termination)')
  }

  /**
   * Create an async generator for reading events from DBOS stream
   *
   * This generator reads from the DBOS workflow stream and yields batches of events.
   * It filters events by executionId and respects the fromIndex parameter.
   *
   * @param executionId The execution ID to read events for
   * @param fromIndex The starting event index (0-based)
   * @returns Async generator yielding event batches
   */
  private async* createEventGenerator(
    executionId: string,
    fromIndex: number,
  ): AsyncGenerator<ExecutionEventImpl[]> {
    try {
      logger.debug({
        executionId,
        fromIndex,
        streamKey: DBOSEventBus.STREAM_KEY,
      }, 'Starting DBOS stream consumption')

      // Buffer events before yielding in batches
      let eventBuffer: ExecutionEventImpl[] = []
      const BATCH_SIZE = 10 // Yield events in batches of 10
      const BATCH_TIMEOUT_MS = 100 // Or yield after 100ms

      let lastYieldTime = Date.now()

      // Read from DBOS stream
      // The workflowID is the executionId (they're the same in our architecture)
      for await (const streamValue of DBOS.readStream<{
        executionId: string
        event: any
        timestamp: number
      }>(executionId, DBOSEventBus.STREAM_KEY)) {
        // Filter by executionId (in case multiple executions share same workflow)
        if (streamValue.executionId !== executionId) {
          continue
        }

        // Deserialize event
        const event = EventImpl.deserializeStatic(streamValue.event)
        if (!event) {
          logger.warn({
            executionId,
            streamValue,
          }, 'Failed to deserialize event from DBOS stream')
          continue
        }

        // Skip events before fromIndex (but keep negative index events)
        // Negative index events (e.g., index -1 for EXECUTION_CREATED) are workflow-level
        // events that should always be included regardless of fromIndex
        if (event.index >= 0 && event.index < fromIndex) {
          continue
        }

        // Add to buffer
        eventBuffer.push(event)

        // Yield batch if buffer is full or timeout elapsed
        const now = Date.now()
        if (eventBuffer.length >= BATCH_SIZE || now - lastYieldTime >= BATCH_TIMEOUT_MS) {
          if (eventBuffer.length > 0) {
            logger.debug({
              executionId,
              batchSize: eventBuffer.length,
            }, 'Yielding event batch from DBOS stream')

            yield eventBuffer
            eventBuffer = []
            lastYieldTime = now
          }
        }
      }

      // Yield remaining events
      if (eventBuffer.length > 0) {
        logger.debug({
          executionId,
          batchSize: eventBuffer.length,
        }, 'Yielding final event batch from DBOS stream')

        yield eventBuffer
      }

      logger.debug({ executionId }, 'DBOS stream consumption completed')
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        executionId,
      }, 'Error reading from DBOS stream')
      throw error
    }
  }
}
