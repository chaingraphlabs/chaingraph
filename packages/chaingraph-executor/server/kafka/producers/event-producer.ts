/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import type { Producer } from 'kafkajs'
import type { ExecutionEventMessage } from '../../types/messages'
import { safeSuperJSONStringify } from 'server/utils/serialization'
import { KafkaTopics } from '../../types/messages'
import { createLogger } from '../../utils/logger'
import { getKafkaClient } from '../client'

const logger = createLogger('event-producer')

// Type guard function to check if an object is an ExecutionEventImpl
function isExecutionEventImpl(obj: any): obj is ExecutionEventImpl {
  return obj
    && typeof obj.index === 'number'
    && typeof obj.type === 'string'
    && obj.timestamp instanceof Date
    && obj.data !== undefined
}

let producer: Producer | null = null
let connectionPromise: Promise<void> | null = null
let isConnected = false

export async function getEventProducer(): Promise<Producer> {
  if (!producer) {
    const kafka = getKafkaClient()
    producer = kafka.producer({
      allowAutoTopicCreation: false,
      idempotent: true,
      retry: {
        initialRetryTime: 100,
        retries: 10,
      },
    })

    // Store the connection promise to avoid multiple connection attempts
    connectionPromise = producer.connect().then(() => {
      isConnected = true
      logger.info('Event producer connected')
    }).catch((error) => {
      logger.error({ error }, 'Failed to connect event producer')
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

export async function publishExecutionEvent(
  message: ExecutionEventMessage,
): Promise<void> {
  const producer = await getEventProducer()

  try {
    // Use the singleton SuperJSON instance to ensure proper type handling
    // const superjson = getSuperJSONInstance()
    const value = safeSuperJSONStringify({
      executionId: message.executionId,
      timestamp: message.timestamp,
      workerId: message.workerId,
      event: message.event.serialize(),
    })

    await producer.send({
      topic: KafkaTopics.EVENTS,
      messages: [{
        key: message.executionId,
        value,
        timestamp: Date.now().toString(),
      }],
      acks: -1, // Wait for all in-sync replicas to acknowledge
      timeout: 30000, // 30 second timeout
    })

    logger.debug({
      executionId: message.executionId,
      eventIndex: message.event.index,
      eventType: message.event.type,
    }, 'Event published')
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      executionId: message.executionId,
    }, 'Failed to publish event')
    throw error
  }
}

export async function disconnectEventProducer(): Promise<void> {
  if (producer && isConnected) {
    await producer.disconnect()
    producer = null
    connectionPromise = null
    isConnected = false
    logger.info('Event producer disconnected')
  }
}
