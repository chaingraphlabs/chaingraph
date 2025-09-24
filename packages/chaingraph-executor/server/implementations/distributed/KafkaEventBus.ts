/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import type { Consumer, Producer } from 'kafkajs'
import type { ExecutionEventMessage } from '../../../types/messages'
import type { IEventBus } from '../../interfaces/IEventBus'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { ExecutionEventImpl as EventImpl } from '@badaitech/chaingraph-types'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { KafkaTopics } from '../../../types/messages'
import { getKafkaClient } from '../../kafka/client'
import { getEventProducer } from '../../kafka/producers/event-producer'
import { createMetricsTracker, MetricsHelper, MetricStages } from '../../metrics'
import { config } from '../../utils/config'
import { createLogger } from '../../utils/logger'
import { safeSuperJSONParse, safeSuperJSONStringify } from '../../utils/serialization'

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
  private readonly metrics = createMetricsTracker('kafka-event-bus')
  private readonly metricsHelper = new MetricsHelper(this.metrics)
  private readonly PARTITION_COUNT = 100 // Must match the topic configuration

  constructor(options?: {
    producer?: Producer
  }) {
    if (options?.producer) {
      this.producer = options.producer
    }
  }

  /**
   * Calculate the partition for a given executionId using consistent hashing
   * This ensures the same executionId always maps to the same partition
   */
  private getPartitionForExecution(executionId: string): number {
    const hash = createHash('md5')
      .update(executionId)
      .digest()
      .readUInt32BE(0)

    return Math.abs(hash) % this.PARTITION_COUNT
  }

  publishEvent = async (executionId: string, event: ExecutionEventImpl): Promise<void> => {
    const scopedMetrics = this.metrics.withContext({
      executionId,
      workerId: config.worker.id,
    })

    if (!this.producer) {
      this.producer = await getEventProducer()
    }

    const message: ExecutionEventMessage = {
      executionId,
      event,
      timestamp: Date.now(),
      workerId: config.worker.id,
    }

    // Calculate target partition for this execution
    const targetPartition = this.getPartitionForExecution(executionId)

    // Track serialization time
    const serializeTimer = this.metricsHelper.createTimer(MetricStages.EVENT_PUBLISH, 'serialize')
    const value = safeSuperJSONStringify({
      executionId: message.executionId,
      timestamp: message.timestamp,
      workerId: message.workerId,
      event: message.event.serialize(),
    })
    const serializationTime = serializeTimer.end()
    const eventSizeBytes = Buffer.byteLength(value)

    // Track event publishing
    await scopedMetrics.trackOperation({
      execute: async () => await this.producer!.send({
        topic: KafkaTopics.EVENTS,
        messages: [{
          key: executionId, // Use executionId as partition key for ordering
          value,
          timestamp: Date.now().toString(),
          headers: {
            'partition-hint': targetPartition.toString(),
            'execution-id': executionId,
          },
        }],
        acks: -1,
        timeout: 30000,
      }),
      stage: MetricStages.EVENT_PUBLISH,
      event: 'publish',
      metadata: {
        event_type: event.type,
        event_index: event.index,
        serialization_ms: serializationTime,
        event_size_bytes: eventSizeBytes,
        topic: KafkaTopics.EVENTS,
        target_partition: targetPartition,
      },
    })
  }

  subscribeToEvents = (
    executionId: string,
    fromIndex: number = 0,
  ): AsyncIterable<ExecutionEventImpl[]> => {
    // Calculate target partition for this execution
    const targetPartition = this.getPartitionForExecution(executionId)

    // Create unique consumer group for this subscription
    const subscriptionId = `sub-${executionId}-${customAlphabet(nolookalikes, 8)()}`

    // Track subscription creation
    this.metrics.track({
      stage: MetricStages.EVENT_PUBLISH,
      event: 'subscription_create',
      context: { executionId, workerId: config.worker.id },
      timestamp: Date.now(),
      subscription_id: subscriptionId,
      from_index: fromIndex,
      target_partition: targetPartition,
    })

    const kafka = getKafkaClient()
    const consumer = kafka.consumer({
      groupId: subscriptionId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 10,
      allowAutoTopicCreation: false,
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

    logger.debug({
      executionId,
      targetPartition,
      subscriptionId,
      message: 'Subscription created with partition optimization',
      expected_filter_rate: `${((this.PARTITION_COUNT - 1) / this.PARTITION_COUNT * 100).toFixed(1)}%`,
    })

    // Return the async generator directly
    return this.createEventGenerator(consumer, executionId, fromIndex, subscriptionId, targetPartition)
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

    // Track unsubscribe
    this.metrics.track({
      stage: MetricStages.EVENT_PUBLISH,
      event: 'subscription_close',
      context: { executionId, workerId: config.worker.id },
      timestamp: Date.now(),
      subscriptions_closed: toRemove.length,
    })

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

    // Dispose metrics tracker
    this.metrics.dispose()

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
    targetPartition: number,
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
          const batchStartTime = Date.now()
          let processedCount = 0
          let skippedCount = 0
          let earlySkippedCount = 0 // Track messages skipped via header filtering

          for (const message of batch.messages) {
            if (!message.value)
              continue

            try {
              // OPTIMIZATION: Check headers first to avoid expensive deserialization
              const partitionHint = message.headers?.['partition-hint']?.toString()
              const headerExecutionId = message.headers?.['execution-id']?.toString()

              // Early exit if partition hint doesn't match
              if (partitionHint && Number.parseInt(partitionHint) !== targetPartition) {
                earlySkippedCount++
                continue
              }

              // Early exit if execution ID from header doesn't match
              if (headerExecutionId && headerExecutionId !== executionId) {
                earlySkippedCount++
                continue
              }

              const messageValue = message.value.toString()

              // Parse message (only for messages that passed header filtering)
              // Use safe parsing to handle potential issues
              const parsedMessage = safeSuperJSONParse<any>(messageValue)
              // TODO: Add schema validation for parsedMessage (zod schema or similar)

              // Double-check executionId from message body (for backward compatibility)
              if (parsedMessage.executionId !== executionId) {
                skippedCount++
                continue
              }

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

              if (!event) {
                logger.warn({
                  executionId,
                  parsedMessage,
                }, 'Failed to deserialize event from Kafka message')
                continue
              }

              // Skip events before fromIndex
              if (event.index < fromIndex) {
                skippedCount++
                continue
              }

              batchEvents.push(event)
              processedCount++
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

          // Track batch processing metrics
          if (processedCount > 0 || skippedCount > 0 || earlySkippedCount > 0) {
            this.metrics.track({
              stage: MetricStages.EVENT_PUBLISH,
              event: 'batch_processed',
              context: { executionId, workerId: config.worker.id },
              timestamp: Date.now(),
              event_count: processedCount,
              skipped_count: skippedCount,
              early_skipped_count: earlySkippedCount, // Messages skipped via header filtering
              batch_size: batch.messages.length,
              duration_ms: Date.now() - batchStartTime,
              target_partition: targetPartition,
              filter_efficiency: earlySkippedCount / (batch.messages.length || 1), // Ratio of early filtered
            })
          }

          // Add all valid events from this batch to the buffer
          if (batchEvents.length > 0) {
            eventBuffer.push(...batchEvents)

            // Update last activity
            const subscription = this.subscriptions.get(subscriptionId)
            if (subscription) {
              subscription.lastActivity = Date.now()
            }
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
