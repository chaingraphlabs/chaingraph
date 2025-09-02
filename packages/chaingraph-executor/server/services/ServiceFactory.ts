/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IEventBus, ITaskQueue } from '../interfaces'
import type { IExecutionStore } from '../stores/interfaces/IExecutionStore'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { KafkaEventBus, KafkaTaskQueue } from '../implementations/distributed'
import { InMemoryEventBus, InMemoryTaskQueue } from '../implementations/local'
import { getExecutionStore } from '../stores/execution-store'
import { config } from '../utils/config'
import { createLogger } from '../utils/logger'

const logger = createLogger('service-factory')

export interface ServiceInstances {
  eventBus: IEventBus
  taskQueue: ITaskQueue
  executionStore: IExecutionStore
}

let serviceInstances: ServiceInstances | null = null

/**
 * Creates appropriate service instances based on execution mode
 */
export async function createServices(
  nodeRegistry: NodeRegistry = NodeRegistry.getInstance(),
): Promise<ServiceInstances> {
  // Return existing instances if already created (singleton)
  if (serviceInstances) {
    return serviceInstances
  }

  logger.info({ mode: config.mode }, 'Creating services for execution mode')

  // Always use PostgreSQL for execution storage
  const executionStore = await getExecutionStore(nodeRegistry)

  if (config.mode === 'local') {
    logger.info('Initializing local mode services (no Kafka required)')

    serviceInstances = {
      eventBus: new InMemoryEventBus(),
      taskQueue: new InMemoryTaskQueue(),
      executionStore,
    }
  } else {
    logger.info('Initializing distributed mode services (Kafka-based)')

    serviceInstances = {
      eventBus: new KafkaEventBus(),
      taskQueue: new KafkaTaskQueue(),
      executionStore,
    }
  }

  logger.info({ mode: config.mode }, 'Services initialized successfully')
  return serviceInstances
}

/**
 * Cleanup all services
 */
export async function closeServices(): Promise<void> {
  if (!serviceInstances) {
    return
  }

  logger.info('Closing all services')

  try {
    await serviceInstances.eventBus.close()
    await serviceInstances.taskQueue.close()
  } catch (error) {
    logger.error({ error }, 'Error closing services')
  }

  serviceInstances = null
  logger.info('All services closed')
}

/**
 * Get current service instances
 */
export function getServices(): ServiceInstances | null {
  return serviceInstances
}
