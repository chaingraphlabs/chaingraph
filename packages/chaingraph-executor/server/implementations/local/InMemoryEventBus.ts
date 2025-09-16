/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import type { IEventBus } from '../../interfaces/IEventBus'
import { EventQueue } from '@badaitech/chaingraph-types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('in-memory-event-bus')

/**
 * In-memory implementation of IEventBus for local development
 * Uses EventQueue for each execution to handle event streaming
 */
export class InMemoryEventBus implements IEventBus {
  private eventQueues: Map<string, EventQueue<ExecutionEventImpl>> = new Map()
  private eventHistory: Map<string, ExecutionEventImpl[]> = new Map()

  publishEvent = async (executionId: string, event: ExecutionEventImpl): Promise<void> => {
    // Store in history
    if (!this.eventHistory.has(executionId)) {
      this.eventHistory.set(executionId, [])
    }
    this.eventHistory.get(executionId)!.push(event)

    // Publish to active queue if exists
    const queue = this.eventQueues.get(executionId)
    if (queue) {
      await queue.publish(event)
    }

    logger.debug({
      executionId,
      eventType: event.type,
      eventIndex: event.index,
    }, 'Event published to in-memory bus')
  }

  subscribeToEvents = (
    executionId: string,
    fromIndex: number = 0,
  ): AsyncIterable<ExecutionEventImpl[]> => {
    // Create or get event queue for this execution
    let queue = this.eventQueues.get(executionId)
    if (!queue) {
      queue = new EventQueue<ExecutionEventImpl>(1000)
      this.eventQueues.set(executionId, queue)

      // Replay historical events if any
      const history = this.eventHistory.get(executionId) || []
      for (const event of history) {
        if (event.index >= fromIndex) {
          queue.publish(event).catch((err) => {
            logger.error({ error: err }, 'Failed to replay historical event')
          })
        }
      }
    }

    const iterator = queue.createIterator()

    // Wrap the iterator to return batches and make it AsyncIterable
    const wrappedIterator = {
      async next(): Promise<IteratorResult<ExecutionEventImpl[]>> {
        const result = await iterator.next()
        if (result.done) {
          return { done: true, value: undefined }
        }
        // Return as batch of one for consistency with Kafka implementation
        return { done: false, value: [result.value] }
      },
      async return(): Promise<IteratorResult<ExecutionEventImpl[]>> {
        if (iterator.return) {
          await iterator.return()
        }
        return { done: true, value: undefined }
      },
      async throw(error?: any): Promise<IteratorResult<ExecutionEventImpl[]>> {
        if (iterator.throw) {
          await iterator.throw(error)
        }
        return { done: true, value: undefined }
      },
      [Symbol.asyncIterator]() {
        return this
      },
    }

    return wrappedIterator
  }

  unsubscribe = async (executionId: string): Promise<void> => {
    const queue = this.eventQueues.get(executionId)
    if (queue) {
      await queue.close()
      this.eventQueues.delete(executionId)
    }
    logger.debug({ executionId }, 'Unsubscribed from in-memory event bus')
  }

  close = async (): Promise<void> => {
    // Close all event queues
    for (const [executionId, queue] of this.eventQueues) {
      await queue.close()
    }
    this.eventQueues.clear()
    this.eventHistory.clear()
    logger.info('In-memory event bus closed')
  }
}
