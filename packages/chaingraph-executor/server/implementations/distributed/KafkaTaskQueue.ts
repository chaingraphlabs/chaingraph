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

    await this.producer.send({
      topic: KafkaTopics.TASKS,
      messages: [{
        key: task.executionId,
        value: safeSuperJSONStringify(task),
        timestamp: Date.now().toString(),
      }],
      acks: -1,
      timeout: 30000,
    })
  }

  consumeTasks = async (handler: (task: ExecutionTask) => Promise<void>): Promise<void> => {
    if (this.isConsuming) {
      throw new Error('Already consuming tasks')
    }

    const kafka = getKafkaClient()
    this.consumer = kafka.consumer({
      groupId: config.kafka.groupId.worker,
      sessionTimeout: 10000,
      heartbeatInterval: 3000,
      rebalanceTimeout: 10000,
      maxWaitTimeInMs: 100,
    })

    await this.consumer.connect()
    await this.consumer.subscribe({
      topics: [KafkaTopics.TASKS],
      fromBeginning: false,
    })

    this.isConsuming = true
    logger.info('Started consuming tasks from Kafka')

    await this.consumer.run({
      eachMessage: async ({ message, partition }) => {
        if (!message.value) {
          logger.warn('Received task with no value')
          return
        }

        try {
          const task = safeSuperJSONParse<ExecutionTask>(message.value.toString())

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
