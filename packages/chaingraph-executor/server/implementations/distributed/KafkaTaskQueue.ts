/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Consumer, Producer } from 'kafkajs'
import type { ExecutionTask } from '../../../types/messages'
import type { ITaskQueue } from '../../interfaces/ITaskQueue'
import { KafkaTopics } from '../../../types/messages'
import { getKafkaClient } from '../../kafka/client'
import { getTaskProducer } from '../../kafka/producers/task-producer'
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

  publishTask = async (task: ExecutionTask): Promise<void> => {
    if (!this.producer) {
      this.producer = await getTaskProducer()
    }

    logger.debug({
      taskExecutionId: task.executionId,
      topic: KafkaTopics.TASKS,
    }, 'Publishing task to Kafka')

    const records = await this.producer.send({
      topic: KafkaTopics.TASKS,
      messages: [{
        key: task.executionId,
        value: safeSuperJSONStringify(task),
        timestamp: Date.now().toString(),
      }],
      acks: 1, // Only wait for leader acknowledgment (faster)
      timeout: 5000, // 5 second timeout for lower latency
      compression: 0, // No compression for lowest latency
    })

    for (const record of records) {
      if (record.errorCode && record.errorCode !== 0) {
        logger.error({
          topicName: record.topicName,
          partition: record.partition,
          errorCode: record.errorCode,
        }, 'Failed to publish task to Kafka')
        throw new Error(`Failed to publish task to Kafka, error code: ${record.errorCode}`)
      }

      logger.debug({
        topicName: record.topicName,
        partition: record.partition,
        baseOffset: record.baseOffset,
        logAppendTime: record.logAppendTime,
        logStartOffset: record.logStartOffset,
      }, 'Task published to Kafka successfully')
    }
  }

  consumeTasks = async (handler: (task: ExecutionTask) => Promise<void>): Promise<void> => {
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
      maxBytesPerPartition: 10485760, // max.partition.fetch.bytes equivalent - 10MB per partition
      readUncommitted: true, // Read only committed messages
      allowAutoTopicCreation: false,
      retry: {
        initialRetryTime: 100,
        retries: 5,
      },
    })

    await this.consumer.connect()
    await this.consumer.subscribe({
      topics: [KafkaTopics.TASKS],
      fromBeginning: false,
    })

    this.isConsuming = true

    await this.consumer.run({
      eachMessage: async ({ message, partition }) => {
        if (!message.value) {
          logger.warn('Received task with no value')
          return
        }

        try {
          const task = safeSuperJSONParse<ExecutionTask>(message.value.toString())

          // TODO: Add schema validation for task (zod schema or similar)

          if (!task) {
            logger.error({
              messageValue: message.value.toString().substring(0, 200),
            }, 'Failed to parse task message - result is undefined')
            return
          }

          await handler(task)
        } catch (error) {
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

    logger.info('Kafka task queue closed')
  }
}
