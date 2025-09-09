/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTask } from 'types/messages'

/**
 * Interface for task queue implementations
 * Handles distribution of execution tasks to workers
 */
export interface ITaskQueue {
  /**
   * Publish an execution task to the queue
   */
  publishTask: (task: ExecutionTask) => Promise<void>

  /**
   * Start consuming tasks from the queue
   * Handler is called for each task
   */
  consumeTasks: (handler: (task: ExecutionTask) => Promise<void>) => Promise<void>

  /**
   * Stop consuming tasks
   */
  stopConsuming: () => Promise<void>

  /**
   * Get the number of pending tasks (if available)
   */
  getPendingCount?: () => Promise<number>

  /**
   * Close the queue and cleanup resources
   */
  close: () => Promise<void>
}
