/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Consumer, Producer } from 'kafkajs'
import type { ExecutionTask } from '../../../types/messages'
import type { ITaskQueue, TaskConsumerContext, TaskHandler } from '../../interfaces/ITaskQueue'
import type { TaskQueueMetric } from '../../metrics'
import { Buffer } from 'node:buffer'
import { KafkaTopics } from '../../../types/messages'
import { getKafkaClient } from '../../kafka/client'
import { getTaskProducer } from '../../kafka/producers/task-producer'
import { createMetricsTracker, MetricsHelper, MetricStages } from '../../metrics'
import { config } from '../../utils/config'
import { createLogger } from '../../utils/logger'
import { safeSuperJSONParse, safeSuperJSONStringify } from '../../utils/serialization'

const logger = createLogger('kafka-task-queue')

/**
 * Kafka-based implementation of ITaskQueue for distributed systems
 */
export class KafkaTaskQueue implements ITaskQueue {
  private producer: Producer | null = null
  private consumer: Consumer | null = null
  private isConsuming = false
  private readonly metrics = createMetricsTracker('kafka-task-queue')
  private readonly metricsHelper = new MetricsHelper(this.metrics)

  publishTask = async (task: ExecutionTask): Promise<void> => {
    const scopedMetrics = this.metrics.withContext({
      executionId: task.executionId,
      flowId: task.flowId,
      retryCount: task.retryCount,
    })

    if (!this.producer) {
      this.producer = await getTaskProducer()
    }

    logger.debug({
      taskExecutionId: task.executionId,
      topic: KafkaTopics.TASKS,
    }, 'Publishing task to Kafka')

    // Track serialization time
    const serializeTimer = this.metricsHelper.createTimer(MetricStages.TASK_QUEUE, 'serialize')
    const serializedTask = safeSuperJSONStringify(task)
    const serializationTime = serializeTimer.end()
    const taskSizeBytes = Buffer.byteLength(serializedTask)

    // Track Kafka publish
    const startPublish = Date.now()
    const records = await this.metricsHelper.trackKafkaPublish(
      KafkaTopics.TASKS,
      { executionId: task.executionId, flowId: task.flowId },
      async () => await this.producer!.send({
        topic: KafkaTopics.TASKS,
        messages: [{
          key: task.executionId,
          value: serializedTask,
          timestamp: Date.now().toString(),
        }],
        acks: -1, // Only wait for leader acknowledgment (faster)
        timeout: 5000, // 5 second timeout for lower latency
        compression: 0, // No compression for lowest latency
      }),
      {
        key: task.executionId,
        size: taskSizeBytes,
      },
    )
    const kafkaSendDuration = Date.now() - startPublish

    for (const record of records) {
      if (record.errorCode && record.errorCode !== 0) {
        logger.error({
          topicName: record.topicName,
          partition: record.partition,
          errorCode: record.errorCode,
        }, 'Failed to publish task to Kafka')

        // Track publish error
        scopedMetrics.track({
          stage: MetricStages.TASK_QUEUE,
          event: 'publish_error',
          timestamp: Date.now(),
          error: `Kafka error code: ${record.errorCode}`,
          partition: record.partition,
        } as TaskQueueMetric)

        throw new Error(`Failed to publish task to Kafka, error code: ${record.errorCode}`)
      }

      // Track successful publish with metadata
      scopedMetrics.track({
        stage: MetricStages.TASK_QUEUE,
        event: 'publish',
        timestamp: Date.now(),
        kafka_send_duration_ms: kafkaSendDuration,
        serialization_ms: serializationTime,
        task_size_bytes: taskSizeBytes,
        partition: record.partition,
        offset: Number(record.baseOffset),
        task_age_ms: Date.now() - task.timestamp,
      } as TaskQueueMetric)

      logger.debug({
        topicName: record.topicName,
        partition: record.partition,
        baseOffset: record.baseOffset,
        logAppendTime: record.logAppendTime,
        logStartOffset: record.logStartOffset,
      }, 'Task published to Kafka successfully')
    }
  }

  consumeTasks = async (handler: TaskHandler): Promise<void> => {
    if (this.isConsuming) {
      throw new Error('Already consuming tasks')
    }

    const kafka = getKafkaClient()
    this.consumer = kafka.consumer({
      groupId: config.kafka.groupId.worker,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      rebalanceTimeout: 30000,
      maxWaitTimeInMs: 100, // fetch.max.wait.ms equivalent - wait up to 100ms
      minBytes: 1, // fetch.min.bytes equivalent - fetch even single bytes
      maxBytes: 52428800, // fetch.max.bytes equivalent - 50MB max fetch
      maxBytesPerPartition: 1048576, // 1MB per partition for controlled processing
      readUncommitted: false, // Read only committed messages
      allowAutoTopicCreation: false,
      retry: {
        initialRetryTime: 100,
        retries: 5,
      },
    })

    await this.consumer.connect()

    // Add rebalance event listeners for monitoring
    this.consumer.on(this.consumer.events.GROUP_JOIN, (event) => {
      logger.info({
        groupId: event.payload.groupId,
        memberId: event.payload.memberId,
        leaderId: event.payload.leaderId,
        duration: event.payload.duration,
      }, 'Consumer joined group')
    })

    this.consumer.on(this.consumer.events.REBALANCING, (event) => {
      logger.warn({
        groupId: event.payload.groupId,
        memberId: event.payload.memberId,
      }, 'Consumer group rebalancing started')
    })

    this.consumer.on(this.consumer.events.CRASH, (event) => {
      logger.error({
        error: event.payload.error,
        groupId: event.payload.groupId,
      }, 'Consumer crashed')
    })

    await this.consumer.subscribe({
      topics: [KafkaTopics.TASKS],
      fromBeginning: false,
    })

    this.isConsuming = true

    await this.consumer.run({
      autoCommit: false, // Disable auto-commit for manual control
      partitionsConsumedConcurrently: 1, // Process one partition at a time for long-running tasks
      eachMessage: async ({ message, partition, topic }) => {
        if (!message.value) {
          logger.warn('Received task with no value')
          return
        }

        const consumeStartTime = Date.now()
        const messageSize = Buffer.byteLength(message.value)

        try {
          // Track deserialization
          const deserializeTimer = this.metricsHelper.createTimer(MetricStages.TASK_QUEUE, 'deserialize')
          const task = safeSuperJSONParse<ExecutionTask>(message.value.toString())
          const deserializationTime = deserializeTimer.end()

          // TODO: Add schema validation for task (zod schema or similar)

          if (!task) {
            logger.error({
              messageValue: message.value.toString().substring(0, 200),
            }, 'Failed to parse task message - result is undefined')
            return
          }

          // Create scoped metrics for this task
          const scopedMetrics = this.metrics.withContext({
            executionId: task.executionId,
            flowId: task.flowId,
            retryCount: task.retryCount,
          })

          // Track consume event
          scopedMetrics.track({
            stage: MetricStages.TASK_QUEUE,
            event: 'consume',
            timestamp: Date.now(),
            partition,
            offset: Number(message.offset),
            task_size_bytes: messageSize,
            deserialization_ms: deserializationTime,
            task_age_ms: Date.now() - task.timestamp,
          } as TaskQueueMetric)

          // Create manual commit context
          const context: TaskConsumerContext = {
            commitOffset: async () => {
              if (!this.consumer) {
                throw new Error('Consumer not initialized')
              }

              // Commit the offset for this specific message
              await this.consumer.commitOffsets([{
                topic,
                partition,
                offset: (Number(message.offset) + 1).toString(), // Commit next offset
              }])

              // Track commit
              logger.debug({
                executionId: task.executionId,
                partition,
                offset: Number(message.offset) + 1,
              }, 'Kafka offset committed')
            },
            partition,
            offset: message.offset.toString(),
            topic,
          }

          // Process the task with metrics and context
          await this.metricsHelper.trackKafkaConsume(
            topic,
            { executionId: task.executionId, flowId: task.flowId },
            async () => await handler(task, context),
            {
              partition,
              offset: Number(message.offset),
            },
          )

          // Track successful processing
          scopedMetrics.track({
            stage: MetricStages.TASK_QUEUE,
            event: 'ack',
            timestamp: Date.now(),
            duration_ms: Date.now() - consumeStartTime,
          })
        } catch (error) {
          // Track processing error
          this.metrics.track({
            stage: MetricStages.TASK_QUEUE,
            event: 'consume_error',
            context: { executionId: 'unknown', workerId: config.worker.id },
            timestamp: Date.now(),
            error: error instanceof Error ? error.message : String(error),
            partition,
            duration_ms: Date.now() - consumeStartTime,
          })

          logger.error({
            error: error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                  name: error.name,
                }
              : String(error),
            messageValue: message.value ? message.value.toString().substring(0, 200) : 'null',
          }, 'Failed to process task')
          // In distributed mode, Kafka will retry based on consumer configuration
        }
      },
    })
  }

  stopConsuming = async (): Promise<void> => {
    logger.info('Stopping Kafka task queue consumer')
    this.isConsuming = false

    if (this.consumer) {
      await this.consumer.disconnect()
      this.consumer = null
    }
  }

  close = async (): Promise<void> => {
    await this.stopConsuming()

    if (this.producer) {
      await this.producer.disconnect()
      this.producer = null
    }

    // Dispose metrics tracker
    this.metrics.dispose()

    logger.info('Kafka task queue closed')
  }
}
