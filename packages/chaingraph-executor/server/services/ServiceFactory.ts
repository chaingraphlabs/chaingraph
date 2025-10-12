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
import { Pool } from 'pg'
import { ExecutionService } from '../../server/services/ExecutionService'
import { getFlowStore } from '../../server/stores/flow-store'
import { DBOSExecutionWorker, initializeDBOS } from '../dbos'
import {
  initializeExecuteFlowStep,
  initializeUpdateStatusSteps,
} from '../dbos'
import { DBOSEventBus, DBOSTaskQueue } from '../implementations/dbos'
import { PostgreSQLMigrationManager } from '../implementations/dbos/migrations/PostgreSQLMigrations'
import { StreamBridgeBuilder } from '../implementations/dbos/streaming'
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
    logger.info('DBOS mode enabled')

    // Step 1: Initialize DBOS runtime (required for both API and Worker processes)
    await initializeDBOS()

    // Step 2: Create PostgreSQL pool for event queries
    const pgPool = new Pool({
      connectionString: config.dbos.systemDatabaseUrl,
      max: 50,
    })

    logger.debug('PostgreSQL connection pool created')

    // Step 3: Run PostgreSQL migrations for real-time notifications
    let migrationsSucceeded = false
    try {
      const migrationManager = new PostgreSQLMigrationManager(pgPool)
      migrationsSucceeded = await migrationManager.migrate()

      if (migrationsSucceeded) {
        logger.info('PostgreSQL migrations succeeded')
      } else {
        logger.warn('PostgreSQL migrations failed, using fallback polling mode')
      }
    } catch (error) {
      logger.warn({
        error: error instanceof Error ? error.message : String(error),
      }, 'Migration setup failed, using fallback polling mode')
    }

    // Step 4: Create StreamBridge (generic DBOS stream infrastructure)
    let streamBridge
    if (migrationsSucceeded) {
      try {
        streamBridge = await StreamBridgeBuilder.create({
          connectionString: config.dbos.systemDatabaseUrl,
          queryPool: pgPool,
        })
        logger.info('StreamBridge initialized (10 PGListeners, real-time mode)')
      } catch (error) {
        logger.error({
          error: error instanceof Error ? error.message : String(error),
        }, 'Failed to initialize StreamBridge')
        throw new Error('StreamBridge initialization failed - cannot proceed')
      }
    } else {
      throw new Error('PostgreSQL migrations failed - real-time streaming required')
    }

    // Step 5: Create event bus (thin wrapper around StreamBridge)
    const eventBus = new DBOSEventBus(streamBridge)

    // Step 6: Initialize steps with dependencies
    initializeUpdateStatusSteps(executionStore)

    // Step 7: Create DBOS worker (to get the queue)
    const dbosWorker = new DBOSExecutionWorker(
      executionStore,
      null as any, // Temporary - will be set via initializeExecuteFlowStep
      {
        concurrency: config.dbos.queueConcurrency,
        workerConcurrency: config.dbos.workerConcurrency,
      },
    )

    // Step 8: Create DBOS task queue wrapper
    const taskQueue = new DBOSTaskQueue(dbosWorker.getQueue())

    // Step 9: Create execution service with task queue
    const executionService = new ExecutionService(
      executionStore,
      eventBus,
      taskQueue,
    )

    // Step 10: Initialize the execution step with service and store
    initializeExecuteFlowStep(executionService, executionStore)

    serviceInstances = {
      eventBus,
      taskQueue,
      executionStore,
      flowStore,
      executionService,
      dbosWorker,
    }

    logger.info('DBOS services initialized')
  } else {
    // Local mode - using in-memory services for development/testing
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
