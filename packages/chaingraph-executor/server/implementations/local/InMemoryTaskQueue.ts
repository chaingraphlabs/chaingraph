/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ITaskQueue } from '../../interfaces/ITaskQueue'
import type { ExecutionTask } from '../../types/messages'
import { createLogger } from '../../utils/logger'

const logger = createLogger('in-memory-task-queue')

/**
 * In-memory implementation of ITaskQueue for local development
 * Uses a simple array-based queue with direct execution
 */
export class InMemoryTaskQueue implements ITaskQueue {
  private queue: ExecutionTask[] = []
  private isConsuming = false
  private handler: ((task: ExecutionTask) => Promise<void>) | null = null
  private processingPromise: Promise<void> | null = null
  private shouldStop = false

  publishTask = async (task: ExecutionTask): Promise<void> => {
    this.queue.push(task)
    logger.debug({
      executionId: task.executionId,
      flowId: task.flowId,
      queueLength: this.queue.length,
    }, 'Task added to in-memory queue')

    // If we have a handler and not currently processing, start processing
    if (this.handler && !this.processingPromise) {
      this.processingPromise = this.processQueue()
    }
  }

  consumeTasks = async (handler: (task: ExecutionTask) => Promise<void>): Promise<void> => {
    if (this.isConsuming) {
      throw new Error('Already consuming tasks')
    }

    this.handler = handler
    this.isConsuming = true
    this.shouldStop = false

    logger.info('Started consuming tasks from in-memory queue')

    // Start processing queue if there are pending tasks
    if (this.queue.length > 0) {
      this.processingPromise = this.processQueue()
    }
  }

  stopConsuming = async (): Promise<void> => {
    logger.info('Stopping in-memory task queue consumer')
    this.shouldStop = true
    this.isConsuming = false

    // Wait for current processing to complete
    if (this.processingPromise) {
      await this.processingPromise
    }

    this.handler = null
  }

  getPendingCount = async (): Promise<number> => {
    return this.queue.length
  }

  close = async (): Promise<void> => {
    await this.stopConsuming()
    this.queue = []
    logger.info('In-memory task queue closed')
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && !this.shouldStop && this.handler) {
      const task = this.queue.shift()
      if (!task)
        continue

      try {
        logger.debug({
          executionId: task.executionId,
          flowId: task.flowId,
        }, 'Processing task from in-memory queue')

        await this.handler(task)

        logger.debug({
          executionId: task.executionId,
        }, 'Task processed successfully')
      } catch (error) {
        logger.error({
          error: error instanceof Error ? error.message : String(error),
          executionId: task.executionId,
        }, 'Failed to process task')
        // In local mode, we might want to retry or handle errors differently
        // For now, just log and continue
      }
    }

    this.processingPromise = null
  }
}
