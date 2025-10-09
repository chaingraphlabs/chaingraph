/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTask } from '../../types'

/**
 * Result of a successful chaingraph execution
 */
export interface ExecutionResult {
  executionId: string
  status: 'completed' | 'failed'
  duration: number
  error?: string
  /**
   * Child execution tasks to be spawned
   * Populated when Event Emitter nodes emit events during execution
   * These must be spawned at workflow level (not in step)
   */
  childTasks?: ExecutionTask[]
}

/**
 * Options for DBOS execution queue
 */
export interface DBOSQueueOptions {
  /**
   * Global concurrency limit across all workers
   * @default 100
   */
  concurrency?: number

  /**
   * Per-worker concurrency limit
   * @default 5
   */
  workerConcurrency?: number
}

/**
 * Options for DBOS execution worker
 */
export interface DBOSWorkerOptions {
  /**
   * Global concurrency limit across all workers
   * @default 100
   */
  concurrency?: number

  /**
   * Per-worker concurrency limit
   * @default 5
   */
  workerConcurrency?: number
}
