/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import type { Consumer, Producer } from 'kafkajs'
import type { IEventBus } from '../../interfaces/IEventBus'
import type { ExecutionEventMessage } from '../../types/messages'
import { ExecutionEventImpl as EventImpl } from '@badaitech/chaingraph-types'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { getKafkaClient } from '../../kafka/client'
import { getEventProducer } from '../../kafka/producers/event-producer'
import { KafkaTopics } from '../../types/messages'
import { config } from '../../utils/config'
import { createLogger } from '../../utils/logger'
import { safeSuperJSONParse } from '../../utils/serialization'

const logger = createLogger('kafka-event-bus')

interface ActiveSubscription {
  consumer: Consumer
  executionId: string
  createdAt: number
  lastActivity: number
}

/**
 * Kafka-based implementation of IEventBus for distributed systems
 */
export class KafkaEventBus implements IEventBus {
  private producer: Producer | null = null
  private subscriptions: Map<string, ActiveSubscription> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  publishEvent = async (executionId: string, event: ExecutionEventImpl): Promise<void> => {
    if (!this.producer) {
      this.producer = await getEventProducer()
    }

    const message: ExecutionEventMessage = {
      executionId,
      event,
      timestamp: Date.now(),
      workerId: config.worker.id,
    }

    await this.producer.send({
      topic: KafkaTopics.EVENTS,
      messages: [{
        key: executionId, // Use executionId as partition key for ordering
        value: JSON.stringify({
          executionId: message.executionId,
          timestamp: message.timestamp,
          workerId: message.workerId,
          event: message.event.serialize(),
        }),
        timestamp: Date.now().toString(),
      }],
      acks: -1,
      timeout: 30000,
    })

    logger.debug({
      executionId,
      eventType: event.type,
      eventIndex: event.index,
    }, 'Event published to Kafka')
  }

  subscribeToEvents = (
    executionId: string,
    fromIndex: number = 0,
  ): AsyncIterable<ExecutionEventImpl[]> => {
    // Create unique consumer group for this subscription
    const subscriptionId = `sub-${executionId}-${customAlphabet(nolookalikes, 8)()}`

    const kafka = getKafkaClient()
    const consumer = kafka.consumer({
      groupId: subscriptionId,
      sessionTimeout: 10000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 100,
    })

    // Store subscription with timestamp for cleanup
    const subscription: ActiveSubscription = {
      consumer,
      executionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    }
    this.subscriptions.set(subscriptionId, subscription)

    // Start cleanup interval if not already running
    this.startCleanupInterval()

    // Return the async generator directly
    return this.createEventGenerator(consumer, executionId, fromIndex, subscriptionId)
  }

  unsubscribe = async (executionId: string): Promise<void> => {
    // Find and close all subscriptions for this execution
    const toRemove: string[] = []

    for (const [subId, sub] of this.subscriptions) {
      if (sub.executionId === executionId) {
        await sub.consumer.disconnect()
        toRemove.push(subId)
      }
    }

    toRemove.forEach(subId => this.subscriptions.delete(subId))

    logger.debug({ executionId, count: toRemove.length }, 'Unsubscribed from Kafka events')
  }

  close = async (): Promise<void> => {
    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    // Close all subscriptions
    for (const [_, sub] of this.subscriptions) {
      await sub.consumer.disconnect()
    }
    this.subscriptions.clear()

    // Disconnect producer if exists
    if (this.producer) {
      await this.producer.disconnect()
      this.producer = null
    }

    logger.info('Kafka event bus closed')
  }

  private startCleanupInterval(): void {
    if (this.cleanupInterval)
      return

    // Clean up stale subscriptions every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleSubscriptions()
    }, 30000)
  }

  private async cleanupStaleSubscriptions(): Promise<void> {
    const now = Date.now()
    const staleThreshold = 5 * 60 * 1000 // 5 minutes of inactivity
    const toRemove: string[] = []

    for (const [subId, sub] of this.subscriptions) {
      if (now - sub.lastActivity > staleThreshold) {
        toRemove.push(subId)
      }
    }

    if (toRemove.length > 0) {
      logger.info({ count: toRemove.length }, 'Cleaning up stale subscriptions')

      for (const subId of toRemove) {
        const sub = this.subscriptions.get(subId)
        if (sub) {
          try {
            await sub.consumer.disconnect()
          } catch (error) {
            logger.error({ error, subscriptionId: subId }, 'Error disconnecting stale consumer')
          }
          this.subscriptions.delete(subId)
        }
      }
    }

    // Stop cleanup interval if no more subscriptions
    if (this.subscriptions.size === 0 && this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  private async* createEventGenerator(
    consumer: Consumer,
    executionId: string,
    fromIndex: number,
    subscriptionId: string,
  ): AsyncGenerator<ExecutionEventImpl[]> {
    try {
      await consumer.connect()
      await consumer.subscribe({
        topics: [KafkaTopics.EVENTS],
        fromBeginning: true, // Start from beginning to catch all events
      })

      const eventBuffer: ExecutionEventImpl[] = []
      let resolver: ((value: ExecutionEventImpl[]) => void) | null = null
      let rejecter: ((error: Error) => void) | null = null

      // Start consuming
      await consumer.run({
        eachMessage: async ({ message }) => {
          if (!message.value)
            return

          try {
            const parsedMessage = safeSuperJSONParse<any>(message.value.toString())

            // Filter by executionId
            if (parsedMessage.executionId !== executionId)
              return

            // Deserialize event
            const event = EventImpl.deserializeStatic(parsedMessage.event)

            // Skip events before fromIndex
            if (event.index < fromIndex)
              return

            eventBuffer.push(event)

            // Update last activity
            const subscription = this.subscriptions.get(subscriptionId)
            if (subscription) {
              subscription.lastActivity = Date.now()
            }

            // If we have a waiting resolver, resolve it
            if (resolver && eventBuffer.length > 0) {
              const events = [...eventBuffer]
              eventBuffer.length = 0
              resolver(events)
              resolver = null
              rejecter = null
            }
          } catch (error) {
            logger.error({ error }, 'Failed to process Kafka message')
            if (rejecter) {
              rejecter(error as Error)
              resolver = null
              rejecter = null
            }
          }
        },
      })

      // Yield events as they come
      while (true) {
        if (eventBuffer.length > 0) {
          const events = [...eventBuffer]
          eventBuffer.length = 0
          yield events
        } else {
          // Wait for new events
          const events = await new Promise<ExecutionEventImpl[]>((resolve, reject) => {
            resolver = resolve
            rejecter = reject
          })
          yield events
        }
      }
    } finally {
      // Cleanup
      await consumer.disconnect()
      this.subscriptions.delete(subscriptionId)
    }
  }
}
