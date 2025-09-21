/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Producer } from 'kafkajs'
import type { ExecutionCommand } from '../../../types/messages'
import { Partitioners } from 'kafkajs'
import { KafkaTopics } from '../../../types/messages'
import { createLogger } from '../../utils/logger'
import { safeSuperJSONStringify } from '../../utils/serialization'
import { getKafkaClient } from '../client'

const logger = createLogger('command-producer')

let producer: Producer | null = null
let connectionPromise: Promise<void> | null = null
let isConnected = false

export async function getCommandProducer(): Promise<Producer> {
  if (!producer) {
    const kafka = getKafkaClient()
    producer = kafka.producer({
      allowAutoTopicCreation: true,
      idempotent: true,
      createPartitioner: Partitioners.DefaultPartitioner,
      maxInFlightRequests: 10, // Increased from 5 for higher throughput
      // Note: KafkaJS doesn't support batch/linger config at producer level
      // These are handled automatically or via send() options
    })

    // Store the connection promise to avoid multiple connection attempts
    connectionPromise = producer.connect().then(() => {
      isConnected = true
    }).catch((error) => {
      logger.error({ error }, 'Failed to connect command producer')
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

export async function publishExecutionCommand(command: ExecutionCommand): Promise<void> {
  const producer = await getCommandProducer()

  try {
    // Use executionId as partition key for ordering (if present)
    const key = command.executionId || command.payload.flowId

    await producer.send({
      topic: KafkaTopics.COMMANDS,
      messages: [{
        key,
        value: safeSuperJSONStringify(command),
        timestamp: Date.now().toString(),
      }],
      acks: 1, // Only wait for leader acknowledgment (optimized for single broker)
      timeout: 5000, // 5 second timeout (reduced from 30s for faster failure detection)
    })

    logger.debug({
      command: command.command,
      executionId: command.executionId,
      flowId: command.payload.flowId,
    }, 'Command published')
  } catch (error) {
    logger.error({
      error,
      command: command.command,
      executionId: command.executionId,
    }, 'Failed to publish command')
    throw error
  }
}

export async function disconnectCommandProducer(): Promise<void> {
  if (producer && isConnected) {
    await producer.disconnect()
    producer = null
    connectionPromise = null
    isConnected = false
    logger.info('Command producer disconnected')
  }
}
