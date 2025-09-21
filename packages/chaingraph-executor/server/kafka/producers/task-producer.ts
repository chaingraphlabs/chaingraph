/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Producer } from 'kafkajs'
import type { ExecutionTask } from '../../../types/messages'
import { Partitioners } from 'kafkajs'
import { safeSuperJSONStringify } from '../../../server/utils/serialization'
import { KafkaTopics } from '../../../types/messages'
import { createLogger } from '../../utils/logger'
import { getKafkaClient } from '../client'

const logger = createLogger('task-producer')

let producer: Producer | null = null
let connectionPromise: Promise<void> | null = null
let isConnected = false

export async function getTaskProducer(): Promise<Producer> {
  if (!producer) {
    const kafka = getKafkaClient()
    producer = kafka.producer({
      allowAutoTopicCreation: true,
      idempotent: true,
      createPartitioner: Partitioners.DefaultPartitioner,
      maxInFlightRequests: 10, // Increased from 5 for higher throughput
    })

    // Store the connection promise to avoid multiple connection attempts
    connectionPromise = producer.connect().then(() => {
      isConnected = true
    }).catch((error) => {
      logger.error({ error }, 'Failed to connect task producer')
      producer = null
      connectionPromise = null
      isConnected = false
      throw error
    })

    await connectionPromise
  } else if (connectionPromise && !isConnected) {
    // If connection is in progress, wait for it
    await connectionPromise
  }

  return producer
}

export async function publishExecutionTask(task: ExecutionTask): Promise<void> {
  const producer = await getTaskProducer()

  try {
    await producer.send({
      topic: KafkaTopics.TASKS,
      messages: [{
        key: task.executionId,
        value: safeSuperJSONStringify(task),
        timestamp: Date.now().toString(),
      }],
      acks: 1, // Only wait for leader acknowledgment (optimized for single broker)
      timeout: 5000, // 5 second timeout (reduced from 30s for faster failure detection)
    })
  } catch (error) {
    logger.error({ error, executionId: task.executionId }, 'Failed to publish task')
    throw error
  }
}

export async function disconnectTaskProducer(): Promise<void> {
  if (producer && isConnected) {
    await producer.disconnect()
    producer = null
    connectionPromise = null
    isConnected = false
    logger.info('Task producer disconnected')
  }
}
