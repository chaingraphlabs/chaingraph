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
  ExecutionQueue,
  executionWorkflow,
  executeFlowAtomic,
  initializeDBOS,
  initializeExecuteFlowStep,
  initializeUpdateStatusSteps,
  shutdownDBOS,
  updateToCompleted,
  updateToFailed,
  updateToRunning,
} from './dbos'

export type { DBOSQueueOptions, DBOSWorkerOptions, ExecutionResult } from './dbos'
export { DBOSTaskQueue } from './implementations/dbos'

// Distributed Implementations
export { KafkaEventBus, KafkaTaskQueue } from './implementations/distributed'

// Local Implementations
export { InMemoryEventBus, InMemoryTaskQueue } from './implementations/local'

// Core Interfaces
export type { IEventBus, ITaskQueue } from './interfaces'
// Kafka Services (for distributed mode)
export { getKafkaClient } from './kafka/client'
export { publishExecutionCommand } from './kafka/producers/command-producer'
export { publishExecutionEvent } from './kafka/producers/event-producer'
export { publishExecutionTask } from './kafka/producers/task-producer'
export { createTopicsIfNotExist } from './kafka/topics'
// Services
export { ExecutionService } from './services/ExecutionService'

export { type CreateExecutionParams } from './services/IExecutionService'

export { RecoveryService } from './services/RecoveryService'
// Service Factory
export { closeServices, createServices, getServices } from './services/ServiceFactory'
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
// Workers
export { ExecutionWorker } from './workers/ExecutionWorker'

// WebSocket Server
export { createWSServer } from './ws-server'
