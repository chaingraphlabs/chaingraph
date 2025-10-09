/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IFlowStore } from '@badaitech/chaingraph-trpc/server'
import type { IEventBus, ITaskQueue } from '../interfaces'
import type { IExecutionStore } from '../stores/interfaces/IExecutionStore'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { ExecutionService } from '../../server/services/ExecutionService'
import { getFlowStore } from '../../server/stores/flow-store'
import { DBOSExecutionWorker, initializeDBOS } from '../dbos'
import {
  initializeExecuteFlowStep,
  initializeUpdateStatusSteps,
} from '../dbos'
import { DBOSEventBus, DBOSTaskQueue } from '../implementations/dbos'
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
  executionService: ExecutionService
  flowStore: IFlowStore
  dbosWorker?: DBOSExecutionWorker // Optional: only present when DBOS is enabled
}

let serviceInstances: ServiceInstances | null = null

/**
 * Creates appropriate service instances based on execution mode and DBOS configuration
 */
export async function createServices(
  nodeRegistry: NodeRegistry = NodeRegistry.getInstance(),
): Promise<ServiceInstances> {
  // Return existing instances if already created (singleton)
  if (serviceInstances) {
    return serviceInstances
  }

  // Always use PostgreSQL for execution storage
  const executionStore = await getExecutionStore()
  const flowStore = await getFlowStore()

  // Check if DBOS mode is enabled
  if (config.dbos.enabled) {
    logger.info('🚀 DBOS mode enabled - using DBOS Durable Queues for task distribution')

    // Step 1: Initialize DBOS runtime (required for both API and Worker processes)
    await initializeDBOS()

    // DBOS architecture: DBOS for both tasks and events
    const eventBus = new DBOSEventBus()

    // Step 2: Initialize steps with dependencies
    // This must happen before creating the worker so steps are ready
    initializeUpdateStatusSteps(executionStore)

    // Step 3: Create DBOS worker first (to get the queue)
    // We'll set the executionService later via initialization
    const dbosWorker = new DBOSExecutionWorker(
      executionStore,
      null as any, // Temporary - will be set via initializeExecuteFlowStep
      {
        concurrency: config.dbos.queueConcurrency,
        workerConcurrency: config.dbos.workerConcurrency,
      },
    )

    // Create DBOS task queue wrapper
    const taskQueue = new DBOSTaskQueue(dbosWorker.getQueue())

    // Step 4: Create execution service with DBOS task queue (not in-memory!)
    // Now child executions will be published to DBOS queue
    const executionService = new ExecutionService(
      executionStore,
      eventBus,
      taskQueue, // ← Use DBOS task queue for child executions!
    )

    // Step 5: Initialize the execution step with service and store
    // This also updates the worker's executionService reference
    initializeExecuteFlowStep(executionService, executionStore)

    serviceInstances = {
      eventBus,
      taskQueue,
      executionStore,
      flowStore,
      executionService,
      dbosWorker,
    }

    logger.info({
      queueConcurrency: config.dbos.queueConcurrency,
      workerConcurrency: config.dbos.workerConcurrency,
    }, 'DBOS services initialized successfully')
  } else if (config.mode === 'local') {
    logger.info('Local mode - using in-memory services')

    const eventBus = new InMemoryEventBus()
    const taskQueue = new InMemoryTaskQueue()

    serviceInstances = {
      eventBus,
      taskQueue,
      executionStore,
      flowStore,
      executionService: new ExecutionService(
        executionStore,
        eventBus,
        taskQueue,
      ),
    }
  } else {
    logger.info('Distributed mode - using Kafka for tasks and events')

    const eventBus = new KafkaEventBus()
    const taskQueue = new KafkaTaskQueue()

    serviceInstances = {
      eventBus,
      taskQueue,
      executionStore,
      flowStore,
      executionService: new ExecutionService(
        executionStore,
        eventBus,
        taskQueue,
      ),
    }
  }

  return serviceInstances!
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
    // Stop DBOS worker if it exists
    if (serviceInstances.dbosWorker) {
      logger.info('Stopping DBOS worker...')
      await serviceInstances.dbosWorker.stop()
    }

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
