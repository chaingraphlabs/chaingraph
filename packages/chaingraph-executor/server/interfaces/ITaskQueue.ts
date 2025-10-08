/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTask } from '../../types/messages'

/**
 * Context provided to task handlers for manual offset management
 */
export interface TaskConsumerContext {
  /**
   * Commit the offset for the current message
   */
  commitOffset: () => Promise<void>

  /**
   * Message metadata
   */
  partition: number
  offset: string
  topic: string
}

/**
 * Task handler with optional context for manual offset management
 */
export type TaskHandler = (task: ExecutionTask, context?: TaskConsumerContext) => Promise<void>

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
   * Handler is called for each task with optional context for manual offset management
   */
  consumeTasks: (handler: TaskHandler) => Promise<void>

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
