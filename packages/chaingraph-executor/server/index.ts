/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Types
export * from '../types'
// DBOS Integration (Optional - new execution engine)
export {
  DBOSExecutionWorker,
  executeFlowAtomic,
  executionQueue,
  ExecutionWorkflows,
  initializeDBOS,
  initializeExecuteFlowStep,
  initializeUpdateStatusSteps,
  QUEUE_NAME,
  shutdownDBOS,
  updateToCompleted,
  updateToFailed,
  updateToRunning,
} from './dbos'

export type { CommandController } from './dbos'

export type { DBOSQueueOptions, DBOSWorkerOptions, ExecutionResult } from './dbos'
export { APITaskQueue, DBOSChildSpawnerQueue, DBOSEventBus, DBOSTaskQueue } from './implementations/dbos'

// Local Implementations
export { InMemoryEventBus, InMemoryTaskQueue } from './implementations/local'

// Core Interfaces
export type { IEventBus, ITaskQueue } from './interfaces'
// Services
export { ExecutionService } from './services/ExecutionService'

export { type CreateExecutionParams } from './services/IExecutionService'

export { RecoveryService } from './services/RecoveryService'
// Service Factory
export { closeServices, createServices, createServicesForAPI, createServicesForWorker, getServices } from './services/ServiceFactory'
export type { ServiceInstances } from './services/ServiceFactory'
// Stores
export { getExecutionStore } from './stores/execution-store'
export { getFlowStore, loadFlow } from './stores/flow-store'
export type { IExecutionStore } from './stores/interfaces/IExecutionStore'

export { PostgresExecutionStore } from './stores/postgres/postgres-execution-store'
export type {
  ExecutionClaimRow,
  ExecutionRecoveryRow,
  ExecutionRow,
} from './stores/postgres/schema'
export {
  executionClaimsTable,
  executionRecoveryTable,
  executionsTable,
} from './stores/postgres/schema'

export { createContext as createTRPCContext } from './trpc/context'

export type { ExecutorContext, Context as TRPCContext } from './trpc/context'
// tRPC
export { executionRouter } from './trpc/router'

export type { ExecutionRouter } from './trpc/router'
// Configuration
export { config } from './utils/config'

export type { ExecutionMode } from './utils/config'

// Utilities
export { closeDatabaseExecutions, closeDatabaseMain, getDatabaseExecutions, getDatabaseMain } from './utils/db'
export { createLogger } from './utils/logger'

// WebSocket Server
export { createWSServer } from './ws-server'
