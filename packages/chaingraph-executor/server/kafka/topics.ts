/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Admin } from 'kafkajs'
import { KafkaTopics } from '../../types/messages'
import { createLogger } from '../utils/logger'
import { getKafkaClient } from './client'

const logger = createLogger('kafka-topics')

interface TopicConfig {
  topic: string
  numPartitions: number
  replicationFactor: number
  configEntries?: Array<{ name: string, value: string }>
}

const topicConfigs: TopicConfig[] = [
  {
    topic: KafkaTopics.COMMANDS,
    numPartitions: 10,
    replicationFactor: 1, // Changed from 3 to 1 for local development
    configEntries: [
      { name: 'retention.ms', value: '604800000' }, // 7 days
      { name: 'cleanup.policy', value: 'delete' },
    ],
  },
  {
    topic: KafkaTopics.EVENTS,
    numPartitions: 50,
    replicationFactor: 1, // Changed from 3 to 1 for local development
    configEntries: [
      { name: 'retention.ms', value: '2592000000' }, // 30 days
      { name: 'compression.type', value: 'lz4' },
      { name: 'cleanup.policy', value: 'delete' },
    ],
  },
  {
    topic: KafkaTopics.TASKS,
    numPartitions: 20,
    replicationFactor: 1, // Changed from 3 to 1 for local development
    configEntries: [
      { name: 'retention.ms', value: '259200000' }, // 3 days
      { name: 'cleanup.policy', value: 'delete' },
    ],
  },
]

export async function createTopicsIfNotExist(): Promise<void> {
  const kafka = getKafkaClient()
  const admin: Admin = kafka.admin()

  try {
    await admin.connect()
    logger.info('Connected to Kafka admin')

    const existingTopics = await admin.listTopics()
    const topicsToCreate = topicConfigs.filter(
      config => !existingTopics.includes(config.topic),
    )

    if (topicsToCreate.length === 0) {
      logger.info('All topics already exist')
      return
    }

    await admin.createTopics({
      topics: topicsToCreate.map(config => ({
        topic: config.topic,
        numPartitions: config.numPartitions,
        replicationFactor: config.replicationFactor,
        configEntries: config.configEntries,
      })),
      waitForLeaders: true,
    })

    logger.info(
      { topics: topicsToCreate.map(t => t.topic) },
      'Created Kafka topics',
    )
  } catch (error) {
    logger.error({ error }, 'Failed to create Kafka topics')
    throw error
  } finally {
    await admin.disconnect()
  }
}
