/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import type { Consumer, Producer } from 'kafkajs'
import type { ExecutionEventMessage } from 'types/messages'
import type { IEventBus } from '../../interfaces/IEventBus'
import { ExecutionEventImpl as EventImpl } from '@badaitech/chaingraph-types'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { KafkaTopics } from 'types/messages'
import { getKafkaClient } from '../../kafka/client'
import { getEventProducer } from '../../kafka/producers/event-producer'
import { config } from '../../utils/config'
import { createLogger } from '../../utils/logger'

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

  constructor(options?: {
    producer?: Producer
  }) {
    if (options?.producer) {
      this.producer = options.producer
    }
  }

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

    const value = JSON.stringify({
      executionId: message.executionId,
      timestamp: message.timestamp,
      workerId: message.workerId,
      event: message.event.serialize(),
    })

    await this.producer.send({
      topic: KafkaTopics.EVENTS,
      messages: [{
        key: executionId, // Use executionId as partition key for ordering
        value,
        timestamp: Date.now().toString(),
      }],
      acks: -1,
      timeout: 30000,
    })

    logger.debug({
      executionId,
      eventType: event.type,
      eventIndex: event.index,
      value,
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
      maxWaitTimeInMs: 10, // Reduced for faster batching
      retry: {
        initialRetryTime: 100, // Start with 100ms retry delay
        maxRetryTime: 5000, // Max 5 seconds between retries
        multiplier: 1.5, // Moderate exponential backoff
        retries: 8, // Allow up to 8 retries
        restartOnFailure: async (error: Error) => {
          logger.error({
            error: error.message,
            subscriptionId,
            executionId,
          }, 'Consumer failed, evaluating restart')

          // Restart on retriable errors, but not on authorization/authentication errors
          const nonRetriableErrors = [
            'SASL_AUTHENTICATION_FAILED',
            'INVALID_CONFIG',
            'TOPIC_AUTHORIZATION_FAILED',
          ]

          const shouldRestart = !nonRetriableErrors.some(errType =>
            error.message.includes(errType),
          )

          if (shouldRestart) {
            logger.info({ subscriptionId, executionId }, 'Restarting consumer after failure')
          } else {
            logger.warn({ subscriptionId, executionId }, 'Not restarting consumer due to non-retriable error')
          }

          return shouldRestart
        },
      },
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

      // Start consuming with batch processing
      await consumer.run({
        eachBatch: async ({ batch }) => {
          const batchEvents: ExecutionEventImpl[] = []
          let hasError = false
          let batchError: Error | null = null

          // Process all messages in the batch
          for (const message of batch.messages) {
            if (!message.value)
              continue

            try {
              // const parsedMessage = safeSuperJSONParse<any>(message.value.toString())
              // const parsedMessage = SuperJSON.deserialize(message.value as any) as any
              const parsedMessage = JSON.parse(message.value.toString())

              // Check if parsing was successful
              if (!parsedMessage) {
                logger.debug({
                  executionId,
                  messageValue: message.value.toString().substring(0, 200),
                  messageType: typeof message.value,
                }, 'Skipping message - failed to parse')
                continue
              }

              // Filter by executionId
              if (parsedMessage.executionId !== executionId)
                continue

              // Check if event data exists
              if (!parsedMessage.event) {
                logger.warn({
                  executionId,
                  parsedMessage,
                }, 'Kafka message missing event data')
                continue
              }

              // Deserialize event
              const event = EventImpl.deserializeStatic(parsedMessage.event)

              console.log(`Deserialized event: ${JSON.stringify(event)}`)

              if (!event) {
                logger.warn({
                  executionId,
                  parsedMessage,
                }, 'Failed to deserialize event from Kafka message')
                continue
              }

              // Skip events before fromIndex
              if (event.index < fromIndex)
                continue

              batchEvents.push(event)
            } catch (error) {
              logger.error({
                error: error instanceof Error
                  ? {
                      message: error.message,
                      stack: error.stack,
                      name: error.name,
                    }
                  : String(error),
                executionId,
                messageValue: message.value ? message.value.toString().substring(0, 200) : 'null',
              }, 'Failed to process Kafka message in batch')
              hasError = true
              batchError = error as Error
            }
          }

          // Add all valid events from this batch to the buffer
          if (batchEvents.length > 0) {
            eventBuffer.push(...batchEvents)

            // Update last activity
            const subscription = this.subscriptions.get(subscriptionId)
            if (subscription) {
              subscription.lastActivity = Date.now()
            }

            logger.debug({
              executionId,
              batchSize: batch.messages.length,
              validEvents: batchEvents.length,
              bufferSize: eventBuffer.length,
            }, 'Processed event batch')
          }

          // If we have a waiting resolver and events, resolve it
          if (resolver && eventBuffer.length > 0) {
            const events = [...eventBuffer]
            eventBuffer.length = 0
            resolver(events)
            resolver = null
            rejecter = null
          }

          // Handle batch-level errors
          if (hasError && batchError && rejecter) {
            rejecter(batchError)
            resolver = null
            rejecter = null
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
