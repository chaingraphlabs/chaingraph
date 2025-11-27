/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AuthService, IFlowStore, IOwnershipResolver } from '@badaitech/chaingraph-trpc/server'
import type { DBOSClient } from '@dbos-inc/dbos-sdk'
import type { IEventBus, ITaskQueue } from '../interfaces'
import type { IExecutionStore } from '../stores/interfaces/IExecutionStore'
import { createAuthService, PgOwnershipResolver } from '@badaitech/chaingraph-trpc/server'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { Pool } from 'pg'
import { ExecutionService } from '../../server/services/ExecutionService'
import { getFlowStore } from '../../server/stores/flow-store'
import { getUserStore } from '../../server/stores/user-store'
import { DBOSExecutionWorker, initializeDBOS } from '../dbos'
import {
  initializeExecuteFlowStep,
  initializeUpdateStatusSteps,
} from '../dbos'
import { executionQueue, QUEUE_NAME } from '../dbos/queue'
// Import new class-based workflow and queue
import { ExecutionWorkflows } from '../dbos/workflows/ExecutionWorkflows'
import { APITaskQueue, DBOSEventBus, DBOSTaskQueue } from '../implementations/dbos'
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
  authService: AuthService
  ownershipResolver: IOwnershipResolver
  dbosWorker?: DBOSExecutionWorker // Optional: only present when DBOS is enabled
  dbosClient?: DBOSClient // Optional: only present in API mode
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
  const userStore = await getUserStore()

  // Create auth service with user store
  const authService = createAuthService(userStore)

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

    // Step 8: Create DBOS task queue wrapper (uses queue name, not ExecutionQueue)
    const taskQueue = new DBOSTaskQueue(QUEUE_NAME)

    // Step 9: Create execution service with task queue
    const executionService = new ExecutionService(
      executionStore,
      eventBus,
      taskQueue,
      userStore,
    )

    // Step 10: Initialize the execution step with service and store
    initializeExecuteFlowStep(executionService, executionStore)

    const ownershipResolver = new PgOwnershipResolver(userStore)

    serviceInstances = {
      eventBus,
      taskQueue,
      executionStore,
      flowStore,
      executionService,
      authService,
      ownershipResolver,
      dbosWorker,
    }

    logger.info('DBOS services initialized')
  } else {
    // Local mode - using in-memory services for development/testing
    logger.info('Local mode - using in-memory services')

    const eventBus = new InMemoryEventBus()
    const taskQueue = new InMemoryTaskQueue()

    const ownershipResolver = new PgOwnershipResolver(userStore)

    serviceInstances = {
      eventBus,
      taskQueue,
      executionStore,
      flowStore,
      executionService: new ExecutionService(
        executionStore,
        eventBus,
        taskQueue,
        userStore,
      ),
      authService,
      ownershipResolver,
    }
  }

  return serviceInstances!
}

/**
 * Create services for API (client-only mode)
 * - NO workflow execution capability
 * - Uses DBOSClient for enqueueing (official DBOS external client API)
 * - Uses DBOSClient.send() for signals (no DBOS runtime needed!)
 * - Uses DBOSClient.cancelWorkflow() for cancellation
 *
 * This function does NOT call initializeDBOS(), preventing the API from
 * launching a full DBOS runtime that could execute workflows locally.
 */
export async function createServicesForAPI(): Promise<ServiceInstances> {
  // Return existing instances if already created (singleton)
  if (serviceInstances) {
    return serviceInstances
  }

  logger.info('Creating services for API (client-only mode)')

  const executionStore = await getExecutionStore()
  const userStore = await getUserStore()
  const authService = createAuthService(userStore)
  const ownershipResolver = new PgOwnershipResolver(userStore)
  const flowStore = await getFlowStore()

  // NO initializeDBOS() call - we use DBOSClient instead!
  // This prevents the API from launching a full DBOS runtime

  // Create PostgreSQL pool for migrations and event streaming
  const pgPool = new Pool({
    connectionString: config.dbos.systemDatabaseUrl,
    max: 50,
  })

  logger.debug('PostgreSQL connection pool created')

  // Run PostgreSQL migrations for real-time notifications
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

  // Create StreamBridge for event subscriptions (uses PostgreSQL directly)
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

  // Create event bus (thin wrapper around StreamBridge)
  const eventBus = new DBOSEventBus(streamBridge)

  // API-only task queue - uses DBOSClient to enqueue
  const taskQueue = new APITaskQueue(
    config.dbos.systemDatabaseUrl,
    pgPool,
  )

  // Get the DBOSClient instance to pass to context
  const dbosClient = await taskQueue.getClient()

  // Create execution service (API needs it for tRPC router)
  const executionService = new ExecutionService(
    executionStore,
    eventBus,
    taskQueue,
    userStore,
  )

  serviceInstances = {
    eventBus,
    taskQueue,
    executionStore,
    flowStore,
    executionService,
    authService,
    ownershipResolver,
    dbosClient,
    // NO dbosWorker - API doesn't process tasks!
  }

  logger.info('API services initialized (client-only mode)')
  return serviceInstances!
}

/**
 * Create services for Worker (full DBOS mode)
 * - Queue created BEFORE DBOS.launch() for dequeue
 * - Full workflow execution capability
 * - Can process tasks from queue
 */
export async function createServicesForWorker(): Promise<ServiceInstances> {
  // Return existing instances if already created (singleton)
  if (serviceInstances) {
    return serviceInstances
  }

  logger.info('Creating services for Worker (full DBOS mode)')

  const executionStore = await getExecutionStore()
  const flowStore = await getFlowStore()
  const userStore = await getUserStore()
  const authService = createAuthService(userStore)

  // CRITICAL: Ensure workflow class is imported BEFORE DBOS.launch()
  // This import ensures tree-shaking doesn't remove the workflow registration
  if (!ExecutionWorkflows.executeChainGraph) {
    throw new Error('ExecutionWorkflows.executeChainGraph not found - workflow not registered')
  }

  // CRITICAL: Ensure queue is created BEFORE DBOS.launch()
  // The queue is created at module level in queue.ts when imported
  if (!executionQueue) {
    throw new Error('Execution queue not created - check queue.ts import')
  }

  logger.info({
    queueName: QUEUE_NAME,
    workflowClass: 'ExecutionWorkflows',
    workflowMethod: 'executeChainGraph',
  }, 'Workflow and queue ready before DBOS initialization')

  // NOW launch DBOS - queue will be registered for dequeue
  await initializeDBOS()

  // Create PostgreSQL pool for event queries
  const pgPool = new Pool({
    connectionString: config.dbos.systemDatabaseUrl,
    max: 50,
  })

  logger.debug('PostgreSQL connection pool created')

  // Run PostgreSQL migrations for real-time notifications
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

  // Create StreamBridge (generic DBOS stream infrastructure)
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

  // Create event bus (thin wrapper around StreamBridge)
  const eventBus = new DBOSEventBus(streamBridge)

  // Initialize steps with dependencies
  initializeUpdateStatusSteps(executionStore)

  // Create DBOS task queue wrapper (uses queue name, not ExecutionQueue)
  const taskQueue = new DBOSTaskQueue(QUEUE_NAME)

  // Create execution service with task queue
  const executionService = new ExecutionService(
    executionStore,
    eventBus,
    taskQueue,
    userStore,
  )

  // Create DBOS worker with the pre-created queue
  const dbosWorker = new DBOSExecutionWorker(
    executionStore,
    executionService,
    {
      concurrency: config.dbos.queueConcurrency,
      workerConcurrency: config.dbos.workerConcurrency,
    },
  )

  // Initialize the execution step with service and store
  initializeExecuteFlowStep(executionService, executionStore)

  const ownershipResolver = new PgOwnershipResolver(userStore)

  serviceInstances = {
    eventBus,
    taskQueue,
    executionStore,
    flowStore,
    executionService,
    authService,
    ownershipResolver,
    dbosWorker,
  }

  logger.info('Worker services initialized (full DBOS mode)')
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
