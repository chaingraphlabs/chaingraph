/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { LogEntry } from 'kafkajs'
import { Kafka, logLevel } from 'kafkajs'
// import { CompressionCodecs, CompressionTypes } from 'kafkajs'
// import LZ4 from 'lz4-kafkajs'
import { config } from '../utils/config'
import { createLogger } from '../utils/logger'

// Register LZ4 codec
// CompressionCodecs[CompressionTypes.LZ4] = new LZ4().codec

const logger = createLogger('kafka-client')
const kafkaLogger = createLogger('kafkajs')

// Custom logger creator for KafkaJS to use Pino
function customLogCreator() {
  return ({ namespace, level, label, log }: LogEntry) => {
    const { message, ...extra } = log

    // Map KafkaJS log levels to Pino log levels
    switch (level) {
      case logLevel.ERROR:
        kafkaLogger.error({ ...extra, label }, message as string)
        break
      case logLevel.WARN:
        kafkaLogger.warn({ ...extra, label }, message as string)
        break
      case logLevel.INFO:
        kafkaLogger.info({ ...extra, label }, message as string)
        break
      case logLevel.DEBUG:
        kafkaLogger.debug({ ...extra, label }, message as string)
        break
      default:
        kafkaLogger.trace({ ...extra, label }, message as string)
    }
  }
}

let kafkaClient: Kafka | null = null

export function getKafkaClient(): Kafka {
  if (!kafkaClient) {
    kafkaClient = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      // logLevel: config.logging.level === 'debug' ? logLevel.DEBUG : logLevel.INFO,
      logLevel: logLevel.WARN,
      logCreator: customLogCreator,
      retry: {
        initialRetryTime: 50, // Reduced from 100ms for faster recovery
        maxRetryTime: 1000, // Max 1 second between retries (faster than default 30s)
        retries: 5, // Reduced from 8 to fail faster and avoid long delays
        multiplier: 1.2, // Gentler exponential backoff
      },
      // Connection timeouts for faster failure detection
      connectionTimeout: 3000, // 3 second connection timeout
      requestTimeout: 5000, // 5 second request timeout
    })
  }

  return kafkaClient
}
