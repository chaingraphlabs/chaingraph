/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IExecutionStore } from '../../stores/interfaces/IExecutionStore'
import { ExecutionStatus } from '../../../types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('update-status-step')

/**
 * Durable steps for updating execution status in the database
 * Each status update is checkpointed by DBOS using the functional API
 */

// Store reference (initialized by worker)
let executionStore: IExecutionStore | null = null

/**
 * Initialize the steps with execution store dependency
 */
export function initializeUpdateStatusSteps(store: IExecutionStore): void {
  executionStore = store
  logger.debug('UpdateStatusSteps initialized')
}

/**
 * Get the store instance, throw if not initialized
 */
function getStore(): IExecutionStore {
  if (!executionStore) {
    throw new Error('UpdateStatusSteps not initialized. Call initializeUpdateStatusSteps() first.')
  }
  return executionStore
}

/**
 * Update execution status to "running"
 * This is the first checkpoint after workflow starts
 */
export async function updateToRunning(executionId: string): Promise<void> {
  const store = getStore()

  await store.updateExecutionStatus({
    executionId,
    status: ExecutionStatus.Running,
    startedAt: new Date(),
  })

  logger.debug(`Execution status updated to running: ${executionId}`)
}

/**
 * Update execution status to "completed"
 * This is the final checkpoint on successful completion
 */
export async function updateToCompleted(executionId: string): Promise<void> {
  const store = getStore()

  await store.updateExecutionStatus({
    executionId,
    status: ExecutionStatus.Completed,
    completedAt: new Date(),
  })

  logger.debug(`Execution status updated to completed: ${executionId}`)
}

/**
 * Update execution status to "failed"
 * This is the final checkpoint on failure
 */
export async function updateToFailed(
  executionId: string,
  errorMessage: string,
): Promise<void> {
  const store = getStore()

  await store.updateExecutionStatus({
    executionId,
    status: ExecutionStatus.Failed,
    errorMessage,
    completedAt: new Date(),
  })

  logger.debug(`Execution status updated to failed: ${executionId}`)
}
