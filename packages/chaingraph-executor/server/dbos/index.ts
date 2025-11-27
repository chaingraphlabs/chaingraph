/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Configuration
export { initializeDBOS, isDBOSLaunched, shutdownDBOS } from './config'

// Core worker
export { DBOSExecutionWorker } from './DBOSExecutionWorker'

// Queue management (new simplified exports)
export { executionQueue, QUEUE_NAME } from './queue'

// Steps (functional API)
export {
  executeFlowAtomic,
  initializeExecuteFlowStep,
  initializeUpdateStatusSteps,
  updateToCompleted,
  updateToFailed,
  updateToRunning,
} from './steps'
// Types
export type { DBOSQueueOptions, DBOSWorkerOptions, ExecutionResult } from './types'

// Child spawner workflow (optional - for spawning from steps)
export {
  childSpawnerWorkflow,
  ExecutionWorkflows,
  sendChildTaskToSpawner,
  startChildSpawner,
} from './workflows'

export type { CommandController } from './workflows'
